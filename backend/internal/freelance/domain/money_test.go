package domain

import (
	"encoding/json"
	"errors"
	"testing"
)

// The defect this file exists to prevent: money held in a float64.
//
// Every case below produces a wrong answer if the conversion goes through
// binary floating point, and the right one if it walks the decimal digits.

func TestParseAmountIsExactWhereFloatIsNot(t *testing.T) {
	// 0.07 and 0.29 have no exact binary representation. Through a float64,
	// 0.07*100 is 7.000000000000001 and truncating gives 7 by luck, while
	// 0.29*100 is 28.999999999999996 and truncating gives 28 - a fils lost on
	// an amount, which is exactly how a milestone total stops summing.
	cases := []struct {
		text string
		want Amount
	}{
		{"0.07", 7},
		{"0.29", 29},
		{"1.15", 115},
		{"8.20", 820},
		{"150.50", 15050},
		{"0", 0},
		{"0.00", 0},
		{"10", 1000},
		{"1.5", 150},
		{"1.500", 150},
		{"999999.99", 99999999},
	}
	for _, tc := range cases {
		got, err := ParseAmountWithExponent(tc.text, 2)
		if err != nil {
			t.Errorf("ParseAmountWithExponent(%q) returned %v", tc.text, err)
			continue
		}
		if got != tc.want {
			t.Errorf("ParseAmountWithExponent(%q) = %d, want %d", tc.text, got, tc.want)
		}
	}
}

func TestParseAmountRejectsExcessPrecision(t *testing.T) {
	// 10.005 AED is not an amount anyone can be charged. Truncating it silently
	// would mean the client agreed to one number and the contract stored
	// another.
	if _, err := ParseAmountWithExponent("10.005", 2); !errors.Is(err, ErrAmountTooPrecise) {
		t.Errorf("10.005 at two decimal places returned %v, want ErrAmountTooPrecise", err)
	}
	// Trailing zeros carry no value and are not an error.
	if got, err := ParseAmountWithExponent("10.5000", 2); err != nil || got != 1050 {
		t.Errorf("10.5000 = %d, %v; want 1050, nil", got, err)
	}
}

func TestParseAmountRejectsMalformedAndNegative(t *testing.T) {
	for _, text := range []string{"", "abc", "1.2.3", "1.", ".", "1e5", " "} {
		if _, err := ParseAmountWithExponent(text, 2); err == nil {
			t.Errorf("ParseAmountWithExponent(%q) accepted a malformed amount", text)
		}
	}
	if _, err := ParseAmountWithExponent("-1.00", 2); !errors.Is(err, ErrAmountNegative) {
		t.Errorf("a negative amount returned %v, want ErrAmountNegative", err)
	}
	// Negative zero is zero, not a refusal.
	if got, err := ParseAmountWithExponent("-0.00", 2); err != nil || got != 0 {
		t.Errorf("-0.00 = %d, %v; want 0, nil", got, err)
	}
}

// The wire format is unchanged by the move to minor units: the existing client
// sends and reads a decimal number, and it must round-trip exactly.
func TestAmountRoundTripsThroughJSON(t *testing.T) {
	type payload struct {
		Rate Amount `json:"hourly_rate"`
	}
	var got payload
	if err := json.Unmarshal([]byte(`{"hourly_rate": 150.50}`), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if got.Rate != 15050 {
		t.Errorf("150.50 unmarshalled to %d minor units, want 15050", got.Rate)
	}

	encoded, err := json.Marshal(got)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if string(encoded) != `{"hourly_rate":150.50}` {
		t.Errorf("re-marshalled to %s, want {\"hourly_rate\":150.50}", encoded)
	}
}

func TestAmountRejectsMalformedJSON(t *testing.T) {
	var amount Amount
	if err := json.Unmarshal([]byte(`"not a number"`), &amount); err == nil {
		t.Error("a string was accepted as an amount")
	}
	if err := json.Unmarshal([]byte(`-5.00`), &amount); !errors.Is(err, ErrAmountNegative) {
		t.Errorf("a negative amount returned %v, want ErrAmountNegative", err)
	}
}

func TestMoneyAddRefusesMixedCurrencies(t *testing.T) {
	aed := Money{MinorUnits: 10000, Currency: "AED"}
	usd := Money{MinorUnits: 10000, Currency: "USD"}
	if _, err := aed.Add(usd); !errors.Is(err, ErrCurrencyMismatch) {
		t.Errorf("adding AED to USD returned %v, want ErrCurrencyMismatch", err)
	}
	sum, err := aed.Add(Money{MinorUnits: 2550, Currency: "AED"})
	if err != nil {
		t.Fatalf("adding two AED amounts failed: %v", err)
	}
	if sum.MinorUnits != 12550 {
		t.Errorf("100.00 + 25.50 = %d minor units, want 12550", sum.MinorUnits)
	}
}

func TestMoneyEqualComparesCurrencyToo(t *testing.T) {
	// Zero of one currency is not zero of another: treating them as equal is
	// how a milestone check in the wrong currency would pass.
	if (Money{Currency: "AED"}).Equal(Money{Currency: "USD"}) {
		t.Error("0 AED compared equal to 0 USD")
	}
}

func TestNormalizeCurrencyRejectsUnknownCodes(t *testing.T) {
	if _, err := NormalizeCurrency("XYZ"); !errors.Is(err, ErrCurrencyUnknown) {
		t.Error("an unknown currency code was accepted")
	}
	// Empty means the launch default rather than an error.
	if code, err := NormalizeCurrency(""); err != nil || code != DefaultCurrency {
		t.Errorf("empty currency = %q, %v; want %q, nil", code, err, DefaultCurrency)
	}
	if code, err := NormalizeCurrency(" aed "); err != nil || code != "AED" {
		t.Errorf("' aed ' = %q, %v; want AED, nil", code, err)
	}
}

// A zero-decimal currency must not be multiplied by a hundred. JPY 1000 is
// ¥1000, and storing it as 100000 would overcharge by two orders of magnitude.
func TestParseAmountHonoursTheCurrencyExponent(t *testing.T) {
	got, err := ParseAmountWithExponent("1000", 0)
	if err != nil || got != 1000 {
		t.Errorf("JPY 1000 = %d, %v; want 1000, nil", got, err)
	}
	// And a three-decimal currency subdivides further.
	got, err = ParseAmountWithExponent("1.234", 3)
	if err != nil || got != 1234 {
		t.Errorf("KWD 1.234 = %d, %v; want 1234, nil", got, err)
	}
}
