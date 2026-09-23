using System.Globalization;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace Firmeza.Web.Infrastructure;

public sealed class InvariantDecimalModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var value = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
        if (value == ValueProviderResult.None)
        {
            return Task.CompletedTask;
        }

        var rawValue = value.FirstValue;
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            if (IsNullableDecimal(bindingContext.ModelMetadata.ModelType))
            {
                bindingContext.Result = ModelBindingResult.Success(null);
            }

            return Task.CompletedTask;
        }

        if (decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var decimalValue)
            || decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.CurrentCulture, out decimalValue))
        {
            bindingContext.Result = ModelBindingResult.Success(decimalValue);
            return Task.CompletedTask;
        }

        bindingContext.ModelState.AddModelError(bindingContext.ModelName, "Ingresa un número decimal válido, por ejemplo 1250.50.");
        return Task.CompletedTask;
    }

    private static bool IsNullableDecimal(Type type)
    {
        return type == typeof(decimal?) || type == typeof(decimal);
    }
}

public sealed class InvariantDecimalModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        var modelType = context.Metadata.ModelType;
        return modelType == typeof(decimal) || modelType == typeof(decimal?)
            ? new BinderTypeModelBinder(typeof(InvariantDecimalModelBinder))
            : null;
    }
}
