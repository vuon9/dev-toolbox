package service

import (
	"testing"

	"devtoolbox/internal/numberconverter"

	"github.com/stretchr/testify/assert"
)

func TestNumberConverterService_Convert(t *testing.T) {
	svc := NewNumberConverterService(nil)

	tests := []struct {
		name                string
		req                 numberconverter.ConvertRequest
		wantError           bool
		wantBinary, wantDec string
		wantHex, wantOctal  string
	}{
		{
			name:       "decimal to all bases",
			req:        numberconverter.ConvertRequest{Value: "255", Base: "decimal"},
			wantBinary: "11111111",
			wantDec:    "255",
			wantHex:    "0xFF",
			wantOctal:  "377",
		},
		{
			name:       "hex with 0x prefix",
			req:        numberconverter.ConvertRequest{Value: "0xFF", Base: "hex"},
			wantBinary: "11111111",
			wantDec:    "255",
			wantHex:    "0xFF",
			wantOctal:  "377",
		},
		{
			name:       "binary input",
			req:        numberconverter.ConvertRequest{Value: "1010", Base: "binary"},
			wantBinary: "1010",
			wantDec:    "10",
			wantHex:    "0xA",
			wantOctal:  "12",
		},
		{
			name:       "octal input",
			req:        numberconverter.ConvertRequest{Value: "17", Base: "octal"},
			wantBinary: "1111",
			wantDec:    "15",
			wantHex:    "0xF",
			wantOctal:  "17",
		},
		{
			name:      "invalid number for base is an error",
			req:       numberconverter.ConvertRequest{Value: "abc", Base: "decimal"},
			wantError: true,
		},
		{
			name:      "unsupported base is an error",
			req:       numberconverter.ConvertRequest{Value: "255", Base: "base64"},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := svc.Convert(tt.req)
			if tt.wantError {
				assert.NotEmpty(t, resp.Error)
				return
			}
			assert.Empty(t, resp.Error)
			assert.Equal(t, tt.wantBinary, resp.Binary)
			assert.Equal(t, tt.wantDec, resp.Decimal)
			assert.Equal(t, tt.wantHex, resp.Hex)
			assert.Equal(t, tt.wantOctal, resp.Octal)
		})
	}
}

func TestNumberConverterService_ConvertInterpretations(t *testing.T) {
	svc := NewNumberConverterService(nil)

	t.Run("255 has all bits set and full byte view", func(t *testing.T) {
		resp := svc.Convert(numberconverter.ConvertRequest{Value: "255", Base: "decimal"})
		assert.Equal(t, []int{1, 1, 1, 1, 1, 1, 1, 1}, resp.Bits)
		assert.Equal(t, []string{"00", "00", "00", "FF"}, resp.Bytes.BigEndian)
		assert.Equal(t, "0.0.0.255", resp.IPv4.Address)
		assert.Equal(t, "broadcast", resp.IPv4.Type)
	})

	t.Run("65 is printable ASCII A", func(t *testing.T) {
		resp := svc.Convert(numberconverter.ConvertRequest{Value: "65", Base: "decimal"})
		assert.Equal(t, "A", resp.ASCII.Char)
		assert.Equal(t, 65, resp.ASCII.Code)
		assert.True(t, resp.ASCII.Printable)
	})
}
