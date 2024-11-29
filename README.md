# API de Reservas

Este documento describe cómo probar los diferentes endpoints de la API de Reservas utilizando **Postman**. Cada sección incluye el subtítulo del código relacionado y el JSON que se debe enviar en el cuerpo (body) para realizar la prueba.

---

## **crearReserva.js**

### Descripción
Este endpoint crea una nueva reserva en la base de datos.

### Método HTTP
**POST**

### URL
```
/reserva
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

### Body (JSON)
```json
{
  "tenant_id": "12345",
  "numero_asientos": 2,
  "fecha": "2024-12-01",
  "monto": 200.00,
  "metodo": "Tarjeta",
  "fecha_pago": "2024-11-29"
}
```

---

## **eliminarReserva.js**

### Descripción
Este endpoint elimina una reserva específica de la base de datos.

### Método HTTP
**DELETE**

### URL
```
/reserva
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

### Body (JSON)
```json
{
  "tenant_id": "12345",
  "ID_reserva": "abcd1234-5678-90ef-ghij-klmnopqrstuv"
}
```

---

## **modificarReserva.js**

### Descripción
Este endpoint actualiza los datos de una reserva existente.

### Método HTTP
**PUT**

### URL
```
/reserva/{tenant_id}/{ID_reserva}
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

### Body (JSON)
```json
{
  "numero_asientos": 4,
  "fecha": "2024-12-02",
  "monto": 400.00,
  "metodo": "Efectivo",
  "fecha_pago": "2024-11-30"
}
```

---

## **obtenerReservaById.js**

### Descripción
Este endpoint obtiene una reserva específica de la base de datos.

### Método HTTP
**GET**

### URL
```
/reserva/{tenant_id}/{ID_reserva}
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

---

## **obtenerReservas.js**

### Descripción
Este endpoint obtiene todas las reservas almacenadas en la base de datos.

### Método HTTP
**GET**

### URL
```
/reservas
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

---