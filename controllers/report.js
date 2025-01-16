require('dotenv').config();
const express = require('express');
const router = express.Router();
const sql = require('msnodesqlv8');
const { mergeAndSumArrays } = require('./../model/globalFunc');
//const connectionString = "Driver={" + process.env.SQL_DRIVE + "};Server=" + process.env.SQL_SERVER + ";Database=" + process.env.SQL_DATABASE + ";Trusted_Connection=yes;";


// Fungsi untuk menjalankan query dengan promise
const runQuery = (query) => {
   return new Promise((resolve, reject) => {
      const WIN_AUTH = "Driver={" + process.env.SQL_DRIVE + "};Server=" + process.env.SQL_SERVER + ";Database=" + process.env.SQL_DATABASE + ";Trusted_Connection=yes;";
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
      const test = await runQuery("select CURRENT_TIMESTAMP as 'success' ");
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
   const brand = req.query.brand;
   const tabs = [
      { tab: '', name: 'Check Bill Dine In' },
      { tab: 'TA', name: 'Check Bill Take Away' },
      { tab: 'DEL', name: 'Check Bill Delivery' },
      { tab: 'HOT', name: 'Check Bill Hotline' },
   ];
   const startDate = req.query.startDate;
   const endDate = !req.query.endDate ? req.query.startDate : req.query.endDate;
 
   const sheet = []; 
   try {

      let c = ` Select  * from OutletGroup where OutletGroup_ID = '${brand}';  `;
      const OutletGroup = await runQuery(c);



      for (let t = 0; t < tabs.length; t++) {

         let whereTabs = tabs[t]['tab'] != '' ? ` and c.TableNo like '%${tabs[t]['tab']}%'` : '';

         let q = `
         SELECT top 2 t1.*, 
         '${OutletGroup[0]['OutletGroup_Desc1']}' AS 'Brand',  
         SUBSTRING(o.OutletDesc_1, CHARINDEX('-', o.OutletDesc_1) + 1, LEN(o.OutletDesc_1)) AS 'Outlet',

         '' as 'indexOfQtyValueAmount'
         from ( 
         SELECT   c.OutletID , count(c.CheckId) as 'qty', sum( p.PaidAmount - p.Change ) as 'amount'
         from OP_MonthlyCheck as c
         left join OP_MonthlyCheckPayment as p
         ON	c.CheckID = p.CheckID AND
            c.OutletID = p.OutletID AND
            c.date = p.date
         where c.date between '${startDate}' and '${endDate}'  ${whereTabs}
         group by  c.OutletID
         ) as t1
         left join Outlet_Profile as o on o.Outlet_ID = t1.OutletID
         where LEFT( o.OutletDesc_1, CHARINDEX(' ',  o.OutletDesc_1) - 1) = '${brand}'
         order by t1.amount asc
      `;
         const items = await runQuery(q);

         const qtyValueAmount = [];
         let temp = 0;
         for (let i = 100000; i <= items[items.length - 1]['amount']; i += 50000) {
            qtyValueAmount.push(i);
            temp = i + 50000;
         }
         qtyValueAmount.push(temp);



         const arrayQtyValueAmount = [];
         let keys = qtyValueAmount;
         let i = 0;
         let dynamicObject = keys.reduce((obj, key) => {
            let temp = '';

            if (i > 0) {
               if (qtyValueAmount[i + 1]) {
                  temp = '-' + (qtyValueAmount[i + 1] - 1000) / 1000 + 'K';
               }
            }
            obj[(key / 1000) + 'K' + temp] = 0; // Assign nilai dinamis, misal `i`
            i++;
            return obj;
         }, {});
         arrayQtyValueAmount.push(dynamicObject);

         
         const data = [];

         for (let i = 0; i < items.length; i++) {

            for (let n = 0; n < qtyValueAmount.length; n++) {
               if (items[i]['amount'] > qtyValueAmount[n] && items[i]['amount'] <= qtyValueAmount[n + 1]) {

                  let temp = '';
                  if (n > 0) {
                     if (qtyValueAmount[n + 1]) {
                        temp = '-' + (qtyValueAmount[n + 1] - 1000) / 1000 + 'K';
                     }
                  }


                  items[i]['indexOfQtyValueAmount'] = n;
                  items[i]['qtyValueAmount'] = (qtyValueAmount[n] / 1000) + "K" + temp;

               }
               else if (items[i]['amount'] <= qtyValueAmount[0]) {
                  items[i]['indexOfQtyValueAmount'] = 0;
                  items[i]['qtyValueAmount'] = (qtyValueAmount[0] / 1000) + "K";
               }
            }
            data.push({ ...items[i], ...arrayQtyValueAmount[0] });
            // data.push({...items[i], ...{qtyValueAmount:arrayQtyValueAmountObj}} ); 

         }
         i = 0;
         data.forEach(el => {
            data[i][el['qtyValueAmount']] = el['amount'];
            i++;
         });



         data.sort((a, b) => {
            if (a.Outlet < b.Outlet) {
               return -1;  // a lebih kecil daripada b
            }
            if (a.Outlet > b.Outlet) {
               return 1;   // b lebih kecil daripada a
            }
            return 0;       // a dan b sama
         });

         const finalData = data;

         finalData.forEach(el => {
            delete el.OutletID;
            delete el.amount;
            delete el.indexOfQtyValueAmount;
            delete el.qtyValueAmount;
            delete el.qty;
         });

         sheet.push({
            name: tabs[t]['name'],
            data: finalData,
            //q :  q,
         });


      }
      res.json({
         error: false,
         get: req.query,
         // arrayQtyValueAmount : arrayQtyValueAmount[0],
         // qtyValueAmount: qtyValueAmount,
         //  items: items,
         // arrayQtyValueAmountObj: arrayQtyValueAmountObj,
         // data: data,
         sheet: sheet,


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
