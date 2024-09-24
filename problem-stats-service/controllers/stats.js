const axios = require('axios'); // For making HTTP requests to the Manage Problem Service

exports.problems = async (req, res) => {
    try {
        const { problemIds } = req.body;

        if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({
                message: 'Invalid or missing problem IDs'
            });
        }

        // Log received problem IDs
        console.log('Received Problem IDs:', problemIds);

        // Fetch executions from Manage Problem Service for the given problem IDs
        const response = await axios.post('http://manage_problem_service:4004/executions', {
            problemIds
        });

        const executions = response.data;

        // Filter executions to include only those with status 'completed' or 'failed'
        const filteredExecutions = executions.filter(execution =>
            execution.status === 'completed' || execution.status === 'failed'
        );

        // Calculate statistics
        const totalExecutions = filteredExecutions.length;
        const completedExecutions = filteredExecutions.filter(execution => execution.status === 'completed').length;
        const failedExecutions = filteredExecutions.filter(execution => execution.status === 'failed').length;
        const successRate = completedExecutions / totalExecutions * 100;

        // If available, calculate average execution time for completed executions
        const averageExecutionTime = filteredExecutions
            .filter(execution => execution.status === 'completed' && execution.executionTime)
            .reduce((acc, curr) => acc + curr.executionTime, 0) / completedExecutions || 0;

        // Return the statistics in the response
        return res.status(200).json({
            totalExecutions,
            completedExecutions,
            failedExecutions,
            successRate,
            averageExecutionTime
        });

    } catch (error) {
        console.error('Error fetching executions from Manage Problem Service:', error);
        res.status(500).json({
            message: 'Failed to fetch executions from Manage Problem Service',
            error: error.message
        });
    }
};
