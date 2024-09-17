const { Problems, Executions } = require('../models/init-models');

exports.problems = async (req, res) => {
    try {
        // Extract problem data from the request body
        const problemData = req.body;

        console.log('Received problem in Browse Problem Service:', problemData);

        // Validate the incoming problem data
        if (!problemData.problemType || !problemData.sessionId) {
            return res.status(400).json({ message: 'Problem type and sessionId are required' });
        }

        // Save the problem data in the database for browsing purposes
        // Assuming you have a Problem model and a `create` function
        const newProblem = await models.Problem.create({
            problemType: problemData.problemType,
            sessionId: problemData.sessionId,
            problemDetails: problemData,  // You can store all problem details in one column or break them into individual columns as needed
        });

        console.log('Problem saved in Browse Problem Service:', newProblem);

        // Send success response back to the Submit Problem Service
        return res.status(200).json({ message: 'Problem saved successfully in Browse Problem Service' });
    } catch (error) {
        console.error('Error saving problem in Browse Problem Service:', error);
        return res.status(500).json({ message: 'Internal server error. Unable to save the problem.' });
    }
};

exports.getExecutionStatus = async (req, res) => {
    try {
        const { executionId } = req.params;
        // Fetch the specific execution details
        const execution = await Executions.findByPk(executionId, {
            include: [{
                model: Problems,
                as: 'problem' // Ensure that 'problem' is correctly set as an alias in your model association
            }]
        });
        if (!execution) {
            return res.status(404).json({ message: "Execution not found" });
        }
        res.json(execution);
    } catch (error) {
        console.error('Failed to retrieve execution status:', error);
        res.status(500).json({ message: 'Failed to retrieve execution status', error: error.message });
    }
};
