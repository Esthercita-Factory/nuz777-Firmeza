namespace Firmeza.Domain.Services;

public static class SaleNumberGenerator
{
    private const string Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const int ShortCodeLength = 6;

    public static string Next(DateTimeOffset now, Guid seed)
        => $"VTA-{now:yyyyMMdd}-{ShortCode(seed)}";

    private static string ShortCode(Guid seed)
    {
        var bytes = seed.ToByteArray();
        var builder = new System.Text.StringBuilder(ShortCodeLength);

        for (var index = 0; index < ShortCodeLength; index++)
        {
            builder.Append(Alphabet[bytes[index] % Alphabet.Length]);
        }

        return builder.ToString();
    }
}
