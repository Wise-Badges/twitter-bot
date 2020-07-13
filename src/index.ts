import express, { Application, Request, Response } from 'express';

const PORT = 5000;

const app: Application = express();

app.get('/', (req: Request, res: Response): void => {
  res.status(200).send({ data: 'Hello world' });
});

app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
