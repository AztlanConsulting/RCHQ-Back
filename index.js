const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const userRouter = require('./router/user.route');
app.use('/users', userRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

