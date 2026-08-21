//go:generate wails3 generate bindings
package main

import (
	"devtoolbox/internal/settings"
	"devtoolbox/service"
	"embed"
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"github.com/wailsapp/wails/v3/pkg/icons"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	serverOnly := flag.Bool("server-only", false, "Run in server-only mode (no GUI)")
	port := flag.Int("port", 8081, "HTTP server port")
	flag.Parse()

	if *serverOnly {
		log.Printf("Starting server-only mode on port %d...", *port)
		StartHTTPServer(*port)
		return
	}

	ginEngine := gin.New()
	ginEngine.Use(gin.Recovery())
	ginEngine.Use(LoggingMiddleware())

	ginEngine.StaticFS("/static", http.FS(assets))
	ginEngine.GET("/", func(c *gin.Context) {
		file, _ := assets.ReadFile("static/index.html")
		c.Data(http.StatusOK, "text/html; charset=utf-8", file)
	})

	ginEngine.GET("/api/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Hello from Gin API!",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// Initialize settings manager
	var configDir string
	if runtime.GOOS == "darwin" {
		configDir = filepath.Join(os.Getenv("HOME"), "Library", "Application Support", "DevToolbox")
	} else if runtime.GOOS == "windows" {
		configDir = filepath.Join(os.Getenv("APPDATA"), "DevToolbox")
	} else {
		configDir = filepath.Join(os.Getenv("HOME"), ".config", "devtoolbox")
	}

	settingsManager := settings.NewManager(configDir)
	if err := settingsManager.Load(); err != nil {
		log.Printf("Failed to load settings: %v", err)
	}

	settingsService := service.NewSettingsService(nil, settingsManager)
	spotlightService := service.NewSpotlightService(nil)
	windowControls := service.NewWindowControls(nil)

	// Create application with options
	app := application.New(application.Options{
		Name:        "DevToolbox",
		Description: "Set of tools for daily development",
		Services: []application.Service{
			application.NewService(&GreetService{}),
			application.NewService(service.NewJWTService(nil)),
			application.NewService(service.NewDateTimeService(nil)),
			application.NewService(service.NewEncrypterService(nil)),
			application.NewService(service.NewEncoderService(nil)),
			application.NewService(service.NewHashGeneratorService(nil)),
			application.NewService(service.NewCodeConverterService(nil)),
			application.NewService(service.NewTextUtilitiesService(nil)),
			application.NewService(service.NewBarcodeService(nil)),
			application.NewService(service.NewDataGeneratorService(nil)),
			application.NewService(service.NewCodeFormatterService(nil)),
			application.NewService(service.NewNumberConverterService(nil)),
			application.NewService(settingsService),
			application.NewService(spotlightService),
			application.NewService(windowControls),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
		Assets: application.AssetOptions{
			// Handler:    ginEngine,
			// Middleware: GinMiddleware(ginEngine),
			Handler: application.AssetFileServerFS(assets),
		},
	})

	settingsService.SetApp(app)

	// Start HTTP server for browser support (background)
	go func() {
		StartHTTPServer(*port)
	}()

	// Create main window
	mainWindow := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:   "main",
		Title:  "DevToolbox",
		Width:  1024,
		Height: 768,
		BackgroundColour: application.RGBA{
			Red:   27,
			Green: 38,
			Blue:  54,
			Alpha: 1,
		},
		Mac: application.MacWindow{
			Backdrop: application.MacBackdropTranslucent,
			TitleBar: application.MacTitleBar{
				AppearsTransparent: false,
				Hide:               false,
			},
		},
		URL: "/",
	})

	// Handle window close - minimize to tray or quit based on setting
	mainWindow.OnWindowEvent(events.Common.WindowClosing, func(event *application.WindowEvent) {
		closeMinimizes := settingsManager.GetCloseMinimizesToTray()
		log.Printf("WindowClosing event triggered. Close minimizes to tray: %v", closeMinimizes)
		if closeMinimizes {
			// Prevent the window from closing
			event.Cancel()
			log.Println("Window close cancelled, hiding window instead")
			// Hide the window instead
			mainWindow.Hide()
			log.Println("Window hidden")
		} else {
			log.Println("Window close allowed (setting is disabled)")
		}
	})

	windowControls.SetWindow(mainWindow)

	// Create spotlight window with special behaviors
	// NSPanel-backed window: non-activating (does not steal focus or activation
	// from the previously active app) and floating, so it behaves like a real
	// Spotlight/Raycast launcher overlay instead of a regular NSWindow.
	spotlightWindow := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "Spotlight",
		Width:            640,
		Height:           384,
		MinHeight:        100,
		Frameless:        true,
		Hidden:           true,
		BackgroundColour: application.RGBA{Red: 22, Green: 22, Blue: 22, Alpha: 255},
		// Center the window
		InitialPosition: application.WindowCentered,
		// Prevent resizing
		DisableResize: true,
		Mac: application.MacWindow{
			// Use a dedicated NSPanel so showing or focusing the launcher does
			// not activate DevToolbox or steal focus from the active app.
			WindowClass: application.MacWindowClassPanel,
			PanelPreferences: application.MacPanelPreferences{
				NonActivating:          true,
				FloatingPanel:          true,
				BecomesKeyOnlyIfNeeded: true,
			},
			// Hidden title bar for clean look
			TitleBar: application.MacTitleBar{
				AppearsTransparent: true,
				Hide:               true,
			},
		},
		URL: "/spotlight",
	})

	// Set the window in spotlight service
	spotlightService.SetWindow(spotlightWindow)

	// Handle spotlight window close - hide instead of close
	spotlightWindow.OnWindowEvent(events.Common.WindowClosing, func(event *application.WindowEvent) {
		event.Cancel()
		spotlightWindow.Hide()
		spotlightWindow.EmitEvent("spotlight:closed", "")
	})

	// Listen for spotlight navigation events
	app.Event.On("spotlight:command-selected", func(event *application.CustomEvent) {
		log.Printf("[Spotlight] Received command-selected event with data: %#v", event.Data)

		var path string
		switch v := event.Data.(type) {
		case string:
			path = v
		case []interface{}:
			if len(v) > 0 {
				path, _ = v[0].(string)
			}
		case map[string]interface{}:
			if p, ok := v["path"].(string); ok {
				path = p
			} else if d, ok := v["data"].(string); ok {
				path = d
			}
		}

		if path == "" {
			log.Printf("[Spotlight] Command selected with empty path")
			return
		}

		log.Printf("[Spotlight] Navigating main window to: %s", path)

		// Switch to main app context
		mainWindow.Show()
		mainWindow.Focus()

		// Hide the panel. Non-activating NSPanels never took over app activation,
		// so hiding immediately cannot make macOS revert focus to another app.
		spotlightWindow.Hide()

		// Tell the frontend to navigate
		mainWindow.EmitEvent("navigate:to", path)
	})

	// Close spotlight window
	app.Event.On("spotlight:close", func(_ *application.CustomEvent) {
		log.Printf("[Spotlight] Spotlight close requested")
		spotlightWindow.Hide()
	})

	// Resize spotlight window to fit content (height driven by the frontend,
	// which knows how many results are visible). Keeps the panel centered.
	app.Event.On("spotlight:resize", func(event *application.CustomEvent) {
		var h float64
		switch v := event.Data.(type) {
		case float64:
			h = v
		case int:
			h = float64(v)
		case string:
			if parsed, err := strconv.ParseFloat(v, 64); err == nil {
				h = parsed
			}
		}
		if h > 0 {
			spotlightWindow.SetSize(640, int(h))
			spotlightWindow.Center()
		}
	})

	// Proxy these events to the main window
	app.Event.On("spotlight:theme:toggle", func(_ *application.CustomEvent) {
		log.Printf("[Spotlight] Relaying theme:toggle to main window")
		mainWindow.EmitEvent("theme:toggle", nil)
	})

	app.Event.On("window:toggle", func(_ *application.CustomEvent) {
		log.Printf("[Spotlight] Window toggle requested")
		if mainWindow.IsVisible() {
			mainWindow.Hide()
		} else {
			mainWindow.Show()
			mainWindow.Focus()
		}
	})

	app.Event.On("app:quit", func(_ *application.CustomEvent) {
		log.Printf("[Spotlight] App quit requested via spotlight")
		app.Quit()
	})

	// Setup system tray
	systray := app.SystemTray.New()

	// Set system tray icon
	if runtime.GOOS == "darwin" {
		systray.SetTemplateIcon(icons.SystrayMacTemplate)
	} else {
		systray.SetDarkModeIcon(icons.SystrayDark)
		systray.SetIcon(icons.SystrayLight)
	}

	// Create tray menu
	trayMenu := app.NewMenu()
	trayMenu.Add("Show DevToolbox").OnClick(func(ctx *application.Context) {
		log.Println("Tray menu 'Show DevToolbox' clicked")
		if !mainWindow.IsVisible() {
			mainWindow.Show()
		}
		if mainWindow.IsMinimised() {
			mainWindow.Restore()
		}
		mainWindow.Focus()
	})
	trayMenu.Add("Open Spotlight (Cmd+Shift+Space)").OnClick(func(ctx *application.Context) {
		log.Println("Tray menu 'Open Spotlight' clicked")
		spotlightService.Toggle()
	})
	trayMenu.AddSeparator()
	trayMenu.Add("Quit").OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	systray.SetMenu(trayMenu)

	// Register global hotkey using golang-design/hotkey for system-wide shortcuts
	go registerGlobalHotkey(spotlightService)

	if err := app.Run(); err != nil {
		panic(err)
	}
}

func GinMiddleware(ginEngine *gin.Engine) application.Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/wails") {
				next.ServeHTTP(w, r)
				return
			}

			ginEngine.ServeHTTP(w, r)
		})
	}
}

func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		startTime := time.Now()

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(startTime)

		// Log request details
		log.Printf("[GIN] %s | %s | %s | %d | %s",
			c.Request.Method,
			c.Request.URL.Path,
			c.ClientIP(),
			c.Writer.Status(),
			latency,
		)
	}
}
