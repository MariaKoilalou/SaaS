const amqp = require('amqplib/callback_api');

// Function to send a message to RabbitMQ
function sendMessageToQueue(message, queue = 'problem_updates_queue') {
    amqp.connect(`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`, (err, connection) => {
        if (err) {
            console.error('Failed to connect to RabbitMQ:', err);
            throw err;
        }

        connection.createChannel((err, channel) => {
            if (err) {
                console.error('Failed to create channel:', err);
                throw err;
            }

            // Ensure the queue exists and is durable
            channel.assertQueue(queue, { durable: true });

            // Convert message to a JSON string
            const msg = JSON.stringify(message);

            // Send the message to the queue
            channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
            console.log(` [x] Sent ${msg} to ${queue}`);

            // Close the connection after sending the message
            setTimeout(() => {
                connection.close();
            }, 500);
        });
    });
}

module.exports = { sendMessageToQueue };
