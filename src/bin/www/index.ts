import dotenv from 'dotenv';
dotenv.config();
import app from '../../app';
import { Logger } from '../../utils/Logger';
import SqlDataSource from '../../data-source';
import { seedBaseData } from '../../seed-config/seedConfig';


(async () => {

  SqlDataSource
    .initialize()
    //Initialize Sql datasource
    .then(() => {

      //Seed data (Currencies)
      seedBaseData().then(() => {

        // Start express server
        app.listen(process.env.PORT || 3000, () => {
          const port = app.get('port');

          Logger.Info(`Sphere Inventory Management System Started at http://localhost:${port}`);
          Logger.Info('Press CTRL+C to stop\n');
        });
      }).catch(error => {
        Logger.Error('Db seed failed : ', error);
      });
    }).catch(error => Logger.Error('DB connection failed : ' + error));


})();
