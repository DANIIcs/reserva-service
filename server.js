const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' }); // Cambia la región según tu configuración
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Endpoint para crear una nueva reserva
app.post('/reserva', async (req, res) => {
    const { tenant_id, ID_reserva, numero_asientos, fecha, monto, metodo, fecha_pago } = req.body;

    const params = {
        TableName: 'Reserva',
        Item: {
            tenant_id,
            ID_reserva,
            numero_asientos,
            fecha,
            monto,
            metodo,
            fecha_pago
        }app
    };

    try {
        await dynamoDb.put(params).promise();
        res.status(201).json({
            message: 'Reserva creada exitosamente',
            reserva: params.Item
        });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo crear la reserva', details: error.message });
    }
});

// Endpoint para obtener una reserva por tenant_id y ID_reserva
app.get('/reserva/:tenant_id/:ID_reserva', async (req, res) => {
    const { tenant_id, ID_reserva } = req.params;

    const params = {
        TableName: 'Reserva',
        Key: {
            tenant_id,
            ID_reserva
        }
    };

    try {
        const result = await dynamoDb.get(params).promise();
        if (result.Item) {
            res.json({ reserva: result.Item });
        } else {
            res.status(404).json({ error: 'Reserva no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la reserva', details: error.message });
    }
});

// Endpoint para actualizar una reserva
app.put('/reserva/:tenant_id/:ID_reserva', async (req, res) => {
    const { tenant_id, ID_reserva } = req.params;
    const { numero_asientos, fecha, monto, metodo, fecha_pago } = req.body;

    const params = {
        TableName: 'Reserva',
        Key: { tenant_id, ID_reserva },
        UpdateExpression: 'set numero_asientos = :numero_asientos, fecha = :fecha, monto = :monto, metodo = :metodo, fecha_pago = :fecha_pago',
        ExpressionAttributeValues: {
            ':numero_asientos': numero_asientos,
            ':fecha': fecha,
            ':monto': monto,
            ':metodo': metodo,
            ':fecha_pago': fecha_pago
        },
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        const result = await dynamoDb.update(params).promise();
        res.json({
            message: 'Reserva actualizada',
            updatedAttributes: result.Attributes
        });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo actualizar la reserva', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
