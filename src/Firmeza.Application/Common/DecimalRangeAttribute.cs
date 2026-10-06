using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace Firmeza.Application.Common;

/// <summary>
/// Rango numérico para decimales que no depende de la cultura del hilo.
/// <see cref="RangeAttribute"/> con <c>typeof(decimal)</c> convierte los límites con
/// <c>CultureInfo.CurrentCulture</c>: en culturas donde el separador decimal es coma,
/// "0.01" no se puede convertir y la validación lanza ArgumentException (HTTP 500).
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class DecimalRangeAttribute : ValidationAttribute
{
    private readonly decimal _minimum;
    private readonly decimal _maximum;

    public DecimalRangeAttribute(string minimum, string maximum)
    {
        _minimum = decimal.TryParse(minimum, NumberStyles.Number, CultureInfo.InvariantCulture, out var min)
            ? min
            : decimal.MinValue;

        _maximum = decimal.TryParse(maximum, NumberStyles.Number, CultureInfo.InvariantCulture, out var max)
            ? max
            : decimal.MaxValue;

        ErrorMessage ??= $"El valor debe estar entre {minimum} y {maximum}.";
    }

    public DecimalRangeAttribute(double minimum, double maximum)
        : this(minimum.ToString(CultureInfo.InvariantCulture), maximum.ToString(CultureInfo.InvariantCulture))
    {
    }

    public decimal Minimum => _minimum;

    public decimal Maximum => _maximum;

    public override string FormatErrorMessage(string name) => string.Format(CultureInfo.CurrentCulture, ErrorMessageString, name);

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null)
        {
            // Null lo valida [Required] si aplica.
            return ValidationResult.Success;
        }

        if (!TryToDecimal(value, out var number))
        {
            return new ValidationResult(
                string.Format(CultureInfo.CurrentCulture, ErrorMessageString, validationContext?.DisplayName ?? "El valor"),
                validationContext?.MemberName is null ? null : [validationContext.MemberName]);
        }

        if (number >= _minimum && number <= _maximum)
        {
            return ValidationResult.Success;
        }

        return new ValidationResult(
            string.Format(CultureInfo.CurrentCulture, ErrorMessageString, validationContext?.DisplayName ?? "El valor"),
            validationContext?.MemberName is null ? null : [validationContext.MemberName]);
    }

    private static bool TryToDecimal(object value, out decimal number)
    {
        switch (value)
        {
            case decimal decimalValue:
                number = decimalValue;
                return true;
            case double doubleValue:
                number = (decimal)doubleValue;
                return true;
            case float floatValue:
                number = (decimal)floatValue;
                return true;
            case int intValue:
                number = intValue;
                return true;
            case long longValue:
                number = longValue;
                return true;
            case string text:
                return decimal.TryParse(text, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out number);
            default:
                number = 0m;
                return false;
        }
    }
}
