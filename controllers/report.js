require('dotenv').config();
const express = require('express');
const router = express.Router();
const sql = require('msnodesqlv8');
const { mergeAndSumArrays } = require('./../model/globalFunc');
//const connectionString = "Driver={" + process.env.SQL_DRIVE + "};Server=" + process.env.SQL_SERVER + ";Database=" + process.env.SQL_DATABASE + ";Trusted_Connection=yes;";


// Fungsi untuk menjalankan query dengan promise
const runQuery = (query) => {
   return new Promise((resolve, reject) => {
      const WIN_AUTH = "Driver={" + process.env.SQL_DRIVE + "};Server=" + process.env.SQL_SERVER + ";Database=" + process.env.SQL_DATABASE  + ";Trusted_Connection=yes;";
      console.log(WIN_AUTH);
      const SQL_AUTH = `
         Driver={${process.env.SQL_DRIVE}};
         Server=${process.env.SQL_SERVER};
         Database=${process.env.SQL_DATABASE};
         UID=${process.env.SQL_USER};
         PWD=${process.env.SQL_PASSWORD};
         Trusted_Connection=${process.env.SQL_TRUSTED_CONNECTION};
         Encrypt=${process.env.SQL_ENCRYPT};
       `;

      sql.query(WIN_AUTH, query, (err, rows) => {
         if (err) {
            reject(err);
         } else {
            resolve(rows);
         }
      });
   });
};


router.get('/test', async (req, res) => {
   console.log("test opk"); 
   try {
      const test = await runQuery( "select CURRENT_TIMESTAMP as 'success' ");
      res.json({
         error: false,
         connection: test,
         get: req.query, 
      });
   } catch (err) {
      console.error('Error: ', err);  
      res.json({
         error: true, 
         message: err, 
      });
   }
});



router.get('/billTotalRange/', async (req, res) => {
   const brand = 'IK';
   const tabs = 'TA';
   try {
      console.log(req.query);
      const get = {}
      const q = `
         SELECT t1.*, o.OutletDesc_1 ,LEFT( o.OutletDesc_1, CHARINDEX(' ',  o.OutletDesc_1) - 1) AS 'brand'
         from (
         SELECT   c.OutletID , sum( p.PaidAmount) as 'amount', '${tabs}' as 'tabs'
         from OP_MonthlyCheck as c
         left join OP_MonthlyCheckPayment as p 
         ON	c.CheckID = p.CheckID AND 
            c.OutletID = p.OutletID AND
            c.date = p.date
         where c.date between '2024-01-01' and '2024-01-01' and c.TableNo like '%${tabs}%' 
         group by  c.OutletID
         ) as t1
         left join Outlet_Profile as o on o.Outlet_ID = t1.OutletID
         where LEFT( o.OutletDesc_1, CHARINDEX(' ',  o.OutletDesc_1) - 1) = '${brand}'
         order by t1.amount asc
         ;  
 
      `; 
      // Jalankan query pertama
      const items = await runQuery(q); 
  
      res.json({
         error: false,
         get: get,
         items: items, 
      });
   } catch (err) {
      console.error('Error: ', err);
      res.status(401).json({
         error: true, 
         message: err.message
      });
   }
});



module.exports = router;
