// Package httpx holds response helpers shared by the delivery layer.
package httpx

import (
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
)

// JSONList writes payload as JSON after replacing every nil slice inside it
// with an empty one.
//
// A Go nil slice marshals to `null`, so a list endpoint with nothing to return
// answers `{"data": null}` or a bare `null` with a 200. Clients that reasonably
// expect an array then fail on the first `.length`, `.map` or range over the
// response — and only for the accounts that have no data yet, which is every
// new account. Handlers that return lists call this instead of c.JSON so the
// empty case is an empty list.
func JSONList(c *gin.Context, status int, payload any) {
	c.JSON(status, normalize(reflect.ValueOf(payload)).Interface())
}

// OKList is JSONList with http.StatusOK.
func OKList(c *gin.Context, payload any) { JSONList(c, http.StatusOK, payload) }

// NonNil returns s, or an empty slice when s is nil.
func NonNil[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}

// normalize returns v with nil slices replaced by empty ones, recursing through
// pointers, interfaces, maps, slices and struct fields. Values are copied where
// they are not addressable, so a caller's own data is never mutated.
func normalize(v reflect.Value) reflect.Value {
	if !v.IsValid() {
		return reflect.ValueOf(map[string]any{})
	}
	switch v.Kind() {
	case reflect.Interface, reflect.Pointer:
		if v.IsNil() {
			return v
		}
		inner := normalize(v.Elem())
		if v.Kind() == reflect.Interface {
			return inner
		}
		out := reflect.New(inner.Type())
		out.Elem().Set(inner)
		return out
	case reflect.Slice:
		if v.IsNil() {
			return reflect.MakeSlice(v.Type(), 0, 0)
		}
		out := reflect.MakeSlice(v.Type(), v.Len(), v.Len())
		for i := 0; i < v.Len(); i++ {
			out.Index(i).Set(coerce(normalize(v.Index(i)), v.Type().Elem()))
		}
		return out
	case reflect.Map:
		if v.IsNil() {
			return v
		}
		out := reflect.MakeMapWithSize(v.Type(), v.Len())
		iter := v.MapRange()
		for iter.Next() {
			out.SetMapIndex(iter.Key(), coerce(normalize(iter.Value()), v.Type().Elem()))
		}
		return out
	case reflect.Struct:
		out := reflect.New(v.Type()).Elem()
		out.Set(v)
		for i := 0; i < out.NumField(); i++ {
			if !out.Type().Field(i).IsExported() {
				continue
			}
			field := out.Field(i)
			field.Set(coerce(normalize(field), field.Type()))
		}
		return out
	default:
		return v
	}
}

// coerce keeps a normalized value assignable to the container it goes back into:
// normalize unwraps interfaces, and an `any` map or field needs it wrapped again.
func coerce(v reflect.Value, target reflect.Type) reflect.Value {
	if !v.IsValid() {
		return reflect.Zero(target)
	}
	if v.Type() == target || v.Type().AssignableTo(target) {
		return v
	}
	out := reflect.New(target).Elem()
	out.Set(v)
	return out
}
