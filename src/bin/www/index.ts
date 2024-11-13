import dotenv from 'dotenv';
dotenv.config();
import app from '../../app';
import { Logger } from '../../utils/Logger';


(async () => {

  // Start express server
  app.listen(process.env.PORT || 3000, () => {
    const port = app.get('port');

    Logger.Info(`Sphere Inventory Management System Started at http://localhost:${port}`);
    Logger.Info('Press CTRL+C to stop\n');
  });


})();
