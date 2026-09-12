package domain

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// Money in the freelance module is an integer count of minor units plus the
// currency those units belong to. 150.50 AED is {15050, "AED"}, never 150.50.
//
// The module used to carry every amount as a float64 read out of a
// NUMERIC(10,2) column. PostgreSQL's side of that was exact; Go's was not. Two
// milestones of 33.33 and one of 33.34 summed to 99.99999999999999 and failed an
// equality check against a 100.00 bid, and no amount of rounding at the edges
// fixes a representation that cannot hold 0.1.
//
// Minor units is the convention billing already uses (billing_plans.price_cents),
// so this is the repository's existing answer rather than a new one.
type Money struct {
	MinorUnits int64  `json:"minor_units"`
	Currency   string `json:"currency"`
}

// Errors callers can act on.
var (
	ErrCurrencyUnknown  = errors.New("freelance: unsupported currency")
	ErrCurrencyMismatch = errors.New("freelance: amounts are in different currencies")
	ErrAmountNegative   = errors.New("freelance: amount cannot be negative")
	ErrAmountMalformed  = errors.New("freelance: amount is not a valid decimal number")
	ErrAmountTooPrecise = errors.New("freelance: amount has more decimal places than the currency allows")
)

// DefaultCurrency is the launch market. It is a default, not an assumption:
// every stored amount carries its own currency column, so a second currency is
// a data change rather than a migration.
const DefaultCurrency = "AED"

// currencyExponent is how many decimal places a currency subdivides into.
//
// Deliberately a closed list. An unknown currency code cannot be converted
// between major and minor units without knowing its exponent, and guessing 2
// would silently multiply a JPY amount by a hundred - JPY has no minor unit at
// all, so ¥1000 would be stored as ¥100000.
var currencyExponent = map[string]int32{
	"AED": 2,
	"USD": 2,
	"EUR": 2,
	"GBP": 2,
	"SAR": 2,
	"INR": 2,
	"JPY": 0,
	"KWD": 3,
	"BHD": 3,
	"OMR": 3,
}

// NormalizeCurrency upper-cases a code and rejects one this module cannot do
// arithmetic in.
func NormalizeCurrency(code string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(code))
	if normalized == "" {
		normalized = DefaultCurrency
	}
	if _, ok := currencyExponent[normalized]; !ok {
		return "", fmt.Errorf("%w: %q", ErrCurrencyUnknown, code)
	}
	return normalized, nil
}

// SupportedCurrencies lists what the module can hold, for documentation and for
// the validation error a caller sees.
func SupportedCurrencies() []string {
	codes := make([]string, 0, len(currencyExponent))
	for code := range currencyExponent {
		codes = append(codes, code)
	}
	// Sorted so the list is stable in an error message and in the OpenAPI text.
	for i := 1; i < len(codes); i++ {
		for j := i; j > 0 && codes[j] < codes[j-1]; j-- {
			codes[j], codes[j-1] = codes[j-1], codes[j]
		}
	}
	return codes
}

// NewMoney builds an amount, rejecting an unknown currency and a negative value.
func NewMoney(minorUnits int64, currency string) (Money, error) {
	code, err := NormalizeCurrency(currency)
	if err != nil {
		return Money{}, err
	}
	if minorUnits < 0 {
		return Money{}, ErrAmountNegative
	}
	return Money{MinorUnits: minorUnits, Currency: code}, nil
}

// Add sums two amounts of the same currency.
//
// Refusing a mismatch rather than coercing: there is no exchange rate in this
// module, so adding 100 AED to 100 USD has no correct answer and returning 200
// of either would be a fabricated one.
func (m Money) Add(other Money) (Money, error) {
	if m.Currency != other.Currency {
		return Money{}, fmt.Errorf("%w: %s and %s", ErrCurrencyMismatch, m.Currency, other.Currency)
	}
	return Money{MinorUnits: m.MinorUnits + other.MinorUnits, Currency: m.Currency}, nil
}

// Equal compares amount and currency together. 0 AED and 0 USD are not equal:
// they are zero of two different things.
func (m Money) Equal(other Money) bool {
	return m.MinorUnits == other.MinorUnits && m.Currency == other.Currency
}

// String renders the amount the way a person writes it, for logs and errors.
func (m Money) String() string {
	return fmt.Sprintf("%s %s", formatMinorUnits(m.MinorUnits, currencyExponent[m.Currency]), m.Currency)
}

// Amount is a monetary quantity in minor units that crosses the HTTP boundary
// as the decimal number people write.
//
// The wire format predates this type: clients send "hourly_rate": 150.5 and the
// existing frontend reads it back the same way. Changing that would break a
// shipped client for no gain the user can see, so the conversion happens here
// instead - and it happens on the literal text of the JSON number, never on a
// float64 parsed from it.
//
// json.Number is what makes that possible: encoding/json hands over the digits
// exactly as they arrived, so 0.07 is the string "0.07" rather than the nearest
// binary double to it.
type Amount int64

// UnmarshalJSON parses a decimal number into minor units without floating point.
//
// The currency's exponent is not known at this point - it arrives in a sibling
// field, and struct field order is not something a JSON document guarantees -
// so this parses at the two-decimal default and the service re-scales when the
// currency says otherwise. Every currency this module supports today except the
// three-decimal Gulf currencies and JPY is two-decimal; ParseAmountWithExponent
// below is what the service calls once it knows.
func (a *Amount) UnmarshalJSON(data []byte) error {
	var raw json.Number
	if err := json.Unmarshal(data, &raw); err != nil {
		return ErrAmountMalformed
	}
	parsed, err := ParseAmountWithExponent(raw.String(), 2)
	if err != nil {
		return err
	}
	*a = parsed
	return nil
}

// MarshalJSON renders minor units back as a decimal number at two places.
func (a Amount) MarshalJSON() ([]byte, error) {
	return []byte(formatMinorUnits(int64(a), 2)), nil
}

// ParseAmountWithExponent converts a decimal string to minor units exactly.
//
// It walks the digits rather than calling strconv.ParseFloat, so "0.07" becomes
// 7 and not 7.000000000000001, and a value carrying more precision than the
// currency has is rejected rather than quietly truncated - a client sending
// 10.005 AED has made a mistake worth hearing about.
func ParseAmountWithExponent(text string, exponent int32) (Amount, error) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return 0, ErrAmountMalformed
	}
	if strings.HasPrefix(trimmed, "+") {
		trimmed = trimmed[1:]
	}
	negative := strings.HasPrefix(trimmed, "-")
	if negative {
		trimmed = trimmed[1:]
	}
	if trimmed == "" {
		return 0, ErrAmountMalformed
	}

	whole, fraction, hasFraction := strings.Cut(trimmed, ".")
	if whole == "" {
		whole = "0"
	}
	if hasFraction && fraction == "" {
		return 0, ErrAmountMalformed
	}
	if !allDigits(whole) || (hasFraction && !allDigits(fraction)) {
		return 0, ErrAmountMalformed
	}
	if int32(len(fraction)) > exponent {
		// Trailing zeros beyond the exponent carry no value, so "1.500" at two
		// places is 150 rather than an error; "1.505" is not.
		significant := strings.TrimRight(fraction[exponent:], "0")
		if significant != "" {
			return 0, ErrAmountTooPrecise
		}
		fraction = fraction[:exponent]
	}
	for int32(len(fraction)) < exponent {
		fraction += "0"
	}

	var minorUnits int64
	for _, digit := range whole + fraction {
		next := minorUnits*10 + int64(digit-'0')
		if next < minorUnits {
			return 0, ErrAmountMalformed // overflowed int64
		}
		minorUnits = next
	}
	if negative {
		if minorUnits == 0 {
			return 0, nil
		}
		return 0, ErrAmountNegative
	}
	return Amount(minorUnits), nil
}

func allDigits(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

// formatMinorUnits renders minor units as a decimal string at the given exponent.
func formatMinorUnits(minorUnits int64, exponent int32) string {
	sign := ""
	if minorUnits < 0 {
		sign = "-"
		minorUnits = -minorUnits
	}
	if exponent <= 0 {
		return fmt.Sprintf("%s%d", sign, minorUnits)
	}
	divisor := int64(1)
	for i := int32(0); i < exponent; i++ {
		divisor *= 10
	}
	return fmt.Sprintf("%s%d.%0*d", sign, minorUnits/divisor, exponent, minorUnits%divisor)
}
