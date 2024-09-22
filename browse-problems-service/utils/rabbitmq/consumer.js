const amqp = require('amqplib/callback_api');

// Replace with the actual RabbitMQ URL
const RABBITMQ_URL = 'amqp://myuser:mypassword@rabbitmq:5672';


// Function to consume messages from RabbitMQ
function consumeMessages(queue = 'execution_updates_queue', handleMessage) {
    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            console.error('Failed to connect to RabbitMQ:', err);
            // Retry connection in case of failure
            console.log('Retrying connection in 5 seconds...');
            return setTimeout(() => consumeMessages(queue, handleMessage), 5000);
        }

        connection.createChannel((err, channel) => {
            if (err) {
                console.error('Failed to create channel:', err);
                throw err;
            }

            // Ensure the queue exists and is durable
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
