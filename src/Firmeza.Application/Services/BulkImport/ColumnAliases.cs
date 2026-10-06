using System.Collections.Generic;

namespace Firmeza.Application.Services.BulkImport;

public enum ImportTargetEntity
{
    Product,
    Customer,
    Sale
}

public static class ColumnAliases
{
    public static readonly Dictionary<string, (ImportTargetEntity Entity, string Field)> DirectMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // Products
        ["sku"] = (ImportTargetEntity.Product, "Sku"),
        ["codigo"] = (ImportTargetEntity.Product, "Sku"),
        ["cod"] = (ImportTargetEntity.Product, "Sku"),
        ["codigoproducto"] = (ImportTargetEntity.Product, "Sku"),
        ["codproducto"] = (ImportTargetEntity.Product, "Sku"),
        ["referencia"] = (ImportTargetEntity.Product, "Sku"),
        ["refproducto"] = (ImportTargetEntity.Product, "Sku"),
        ["ref"] = (ImportTargetEntity.Product, "Sku"),
        ["clave"] = (ImportTargetEntity.Product, "Sku"),
        ["idproducto"] = (ImportTargetEntity.Product, "Sku"),

        ["nombreproducto"] = (ImportTargetEntity.Product, "Name"),
        ["producto"] = (ImportTargetEntity.Product, "Name"),
        ["articulo"] = (ImportTargetEntity.Product, "Name"),
        ["material"] = (ImportTargetEntity.Product, "Name"),
        ["descripcioncorta"] = (ImportTargetEntity.Product, "Name"),

        ["categoria"] = (ImportTargetEntity.Product, "Category"),
        ["rubro"] = (ImportTargetEntity.Product, "Category"),
        ["linea"] = (ImportTargetEntity.Product, "Category"),
        ["grupo"] = (ImportTargetEntity.Product, "Category"),
        ["familia"] = (ImportTargetEntity.Product, "Category"),

        ["unidad"] = (ImportTargetEntity.Product, "Unit"),
        ["um"] = (ImportTargetEntity.Product, "Unit"),
        ["unidadmedida"] = (ImportTargetEntity.Product, "Unit"),
        ["unidadventa"] = (ImportTargetEntity.Product, "Unit"),
        ["presentacion"] = (ImportTargetEntity.Product, "Unit"),

        ["precio"] = (ImportTargetEntity.Product, "Price"),
        ["costo"] = (ImportTargetEntity.Product, "Price"),
        ["valor"] = (ImportTargetEntity.Product, "Price"),
        ["precioproducto"] = (ImportTargetEntity.Product, "Price"),

        ["stock"] = (ImportTargetEntity.Product, "Stock"),
        ["existencia"] = (ImportTargetEntity.Product, "Stock"),
        ["inventario"] = (ImportTargetEntity.Product, "Stock"),
        ["cantstock"] = (ImportTargetEntity.Product, "Stock"),
        ["stockactual"] = (ImportTargetEntity.Product, "Stock"),

        ["descripcion"] = (ImportTargetEntity.Product, "Description"),
        ["descripcionlarga"] = (ImportTargetEntity.Product, "Description"),
        ["detalle"] = (ImportTargetEntity.Product, "Description"),

        // Customers
        ["documento"] = (ImportTargetEntity.Customer, "Document"),
        ["doc"] = (ImportTargetEntity.Customer, "Document"),
        ["cedula"] = (ImportTargetEntity.Customer, "Document"),
        ["dni"] = (ImportTargetEntity.Customer, "Document"),
        ["nit"] = (ImportTargetEntity.Customer, "Document"),
        ["ruc"] = (ImportTargetEntity.Customer, "Document"),
        ["cc"] = (ImportTargetEntity.Customer, "Document"),
        ["identificacion"] = (ImportTargetEntity.Customer, "Document"),
        ["numdocumento"] = (ImportTargetEntity.Customer, "Document"),

        ["nombrecliente"] = (ImportTargetEntity.Customer, "FullName"),
        ["cliente"] = (ImportTargetEntity.Customer, "FullName"),
        ["razonsocial"] = (ImportTargetEntity.Customer, "FullName"),
        ["nombrecompleto"] = (ImportTargetEntity.Customer, "FullName"),
        ["comprador"] = (ImportTargetEntity.Customer, "FullName"),

        ["edad"] = (ImportTargetEntity.Customer, "Age"),
        ["anos"] = (ImportTargetEntity.Customer, "Age"),
        ["anios"] = (ImportTargetEntity.Customer, "Age"),

        ["email"] = (ImportTargetEntity.Customer, "Email"),
        ["correo"] = (ImportTargetEntity.Customer, "Email"),
        ["correoelectronico"] = (ImportTargetEntity.Customer, "Email"),
        ["mail"] = (ImportTargetEntity.Customer, "Email"),

        ["telefono"] = (ImportTargetEntity.Customer, "Phone"),
        ["tel"] = (ImportTargetEntity.Customer, "Phone"),
        ["celular"] = (ImportTargetEntity.Customer, "Phone"),
        ["movil"] = (ImportTargetEntity.Customer, "Phone"),
        ["contacto"] = (ImportTargetEntity.Customer, "Phone"),

        ["direccion"] = (ImportTargetEntity.Customer, "Address"),
        ["domicilio"] = (ImportTargetEntity.Customer, "Address"),
        ["ubicacion"] = (ImportTargetEntity.Customer, "Address"),

        // Sales / Lines
        ["numeroventa"] = (ImportTargetEntity.Sale, "SaleNumber"),
        ["factura"] = (ImportTargetEntity.Sale, "SaleNumber"),
        ["nroventa"] = (ImportTargetEntity.Sale, "SaleNumber"),
        ["nrofactura"] = (ImportTargetEntity.Sale, "SaleNumber"),
        ["nro"] = (ImportTargetEntity.Sale, "SaleNumber"),
        ["venta"] = (ImportTargetEntity.Sale, "SaleNumber"),

        ["fechaventa"] = (ImportTargetEntity.Sale, "SaleDate"),
        ["fechaemision"] = (ImportTargetEntity.Sale, "SaleDate"),
        ["fecha"] = (ImportTargetEntity.Sale, "SaleDate"),

        ["cantidad"] = (ImportTargetEntity.Sale, "Quantity"),
        ["cant"] = (ImportTargetEntity.Sale, "Quantity"),
        ["qty"] = (ImportTargetEntity.Sale, "Quantity"),
        ["cantidadvendida"] = (ImportTargetEntity.Sale, "Quantity"),
        ["unidades"] = (ImportTargetEntity.Sale, "Quantity"),

        ["preciounitario"] = (ImportTargetEntity.Sale, "UnitPrice"),
        ["precioventa"] = (ImportTargetEntity.Sale, "UnitPrice"),
        ["valorunitario"] = (ImportTargetEntity.Sale, "UnitPrice"),

        ["estado"] = (ImportTargetEntity.Sale, "Status"),
        ["situacion"] = (ImportTargetEntity.Sale, "Status")
    };
}
