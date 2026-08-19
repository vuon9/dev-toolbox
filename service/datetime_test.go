package service

import (
	"testing"

	"devtoolbox/internal/datetimeconverter"

	"github.com/stretchr/testify/assert"
)

func TestDateTimeService_Convert(t *testing.T) {
	svc := NewDateTimeService(nil)

	tests := []struct {
		name             string
		req              datetimeconverter.ConvertRequest
		wantError        bool
		wantUnixSeconds  int64
		wantUTC          string
		wantDetectedType string
		wantDetectedPrec string
	}{
		{
			name: "10 digit timestamp to ISO",
			req: datetimeconverter.ConvertRequest{
				Input:        "1700000000",
				OutputFormat: "iso",
			},
			wantUnixSeconds:  1700000000,
			wantUTC:          "2023-11-14T22:13:20Z",
			wantDetectedType: "timestamp",
			wantDetectedPrec: "seconds",
		},
		{
			name: "ISO input round-trips to same instant",
			req: datetimeconverter.ConvertRequest{
				Input: "2023-11-14T22:13:20Z",
			},
			wantUnixSeconds:  1700000000,
			wantUTC:          "2023-11-14T22:13:20Z",
			wantDetectedType: "iso",
			wantDetectedPrec: "seconds",
		},
		{
			name: "empty input is an error",
			req: datetimeconverter.ConvertRequest{
				Input: "",
			},
			wantError: true,
		},
		{
			name: "unparseable input is an error",
			req: datetimeconverter.ConvertRequest{
				Input: "not-a-date",
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := svc.Convert(tt.req)
			assert.NoError(t, err) // Service surfaces errors inside the response, not as Go errors
			if tt.wantError {
				assert.NotEmpty(t, resp.Error)
				assert.Nil(t, resp.Result)
				return
			}
			assert.Empty(t, resp.Error)
			assert.NotNil(t, resp.Result)
			assert.Equal(t, tt.wantUnixSeconds, resp.Result.UnixSeconds)
			assert.Equal(t, tt.wantUTC, resp.Result.UTC)
			assert.Equal(t, tt.wantDetectedType, resp.DetectedType)
			assert.Equal(t, tt.wantDetectedPrec, resp.DetectedPrec)
		})
	}
}

func TestDateTimeService_GetPresets(t *testing.T) {
	svc := NewDateTimeService(nil)

	resp, err := svc.GetPresets()
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Presets)

	expected := []string{"now", "plus1hour", "plus1day", "tomorrow9am", "nextweek", "startofday", "endofday", "startofweek", "endofweek", "epoch"}
	for _, id := range expected {
		found := false
		for _, preset := range resp.Presets {
			if preset.ID == id {
				found = true
				break
			}
		}
		assert.Truef(t, found, "expected preset %q in presets", id)
	}

	// The epoch preset is the only deterministic one: timestamp is always 0.
	var epoch *datetimeconverter.Preset
	for i := range resp.Presets {
		if resp.Presets[i].ID == "epoch" {
			epoch = &resp.Presets[i]
			break
		}
	}
	if assert.NotNil(t, epoch, "expected an epoch preset") {
		assert.Equal(t, int64(0), epoch.Timestamp)
	}
}

func TestDateTimeService_CalculateDelta(t *testing.T) {
	svc := NewDateTimeService(nil)

	tests := []struct {
		name        string
		req         datetimeconverter.DeltaRequest
		wantError   bool
		wantDays    int
		wantHours   int
		wantSeconds float64
		wantFuture  bool
	}{
		{
			name: "one day between ISO dates",
			req: datetimeconverter.DeltaRequest{
				DateA: "2026-02-01T12:00:00Z",
				DateB: "2026-02-02T12:00:00Z",
			},
			wantDays:    1,
			wantHours:   0,
			wantSeconds: 86400,
			wantFuture:  true,
		},
		{
			name: "identical timestamps yield zero delta",
			req: datetimeconverter.DeltaRequest{
				DateA: "1700000000",
				DateB: "1700000000",
			},
			wantDays:    0,
			wantHours:   0,
			wantSeconds: 0,
			wantFuture:  false,
		},
		{
			name: "invalid date is an error",
			req: datetimeconverter.DeltaRequest{
				DateA: "not-a-date",
				DateB: "1700000000",
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := svc.CalculateDelta(tt.req)
			assert.NoError(t, err)
			if tt.wantError {
				assert.NotEmpty(t, resp.Error)
				assert.Nil(t, resp.Delta)
				return
			}
			assert.Empty(t, resp.Error)
			if assert.NotNil(t, resp.Delta) {
				assert.Equal(t, tt.wantDays, resp.Delta.Days)
				assert.Equal(t, tt.wantHours, resp.Delta.Hours)
				assert.Equal(t, tt.wantSeconds, resp.Delta.TotalSeconds)
				assert.Equal(t, tt.wantFuture, resp.Delta.IsFuture)
			}
		})
	}
}

func TestDateTimeService_GetAvailableTimezones(t *testing.T) {
	svc := NewDateTimeService(nil)

	resp, err := svc.GetAvailableTimezones()
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Timezones)
}
