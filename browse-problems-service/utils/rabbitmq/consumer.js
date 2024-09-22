const amqp = require('amqplib/callback_api');

// Function to consume messages from RabbitMQ
function consumeMessages(queue = 'problem_updates_queue', handleMessage) {
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

            // Ensure the queue exists
            channel.assertQueue(queue, { durable: true });

            console.log(` [*] Waiting for messages in ${queue}. To exit press CTRL+C`);

            // Consume messages from the queue
            channel.consume(queue, (msg) => {
                if (msg !== null) {
                    const content = msg.content.toString();
                    const message = JSON.parse(content);

                    console.log(` [x] Received ${content}`);

                    // Call the provided handler function to process the message
                    handleMessage(message);

                    // Acknowledge the message after it's processed
                    channel.ack(msg);
                }
            });
        });
    });
}

module.exports = { consumeMessages };
