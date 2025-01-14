select t1.*, o.OutletDesc_1 ,LEFT( o.OutletDesc_1, CHARINDEX(' ',  o.OutletDesc_1) - 1) AS 'brand'
from (
select   c.OutletID , sum( p.PaidAmount) as 'amount', count( p.PaidAmount) as 'qty'
from OP_MonthlyCheck as c
left join OP_MonthlyCheckPayment as p 
ON	c.CheckID = p.CheckID AND 
	c.OutletID = p.OutletID AND
	c.date = p.date
where c.date between '2024-01-02' and '2024-01-02' 
and c.TableNo like '%TA%' 
group by  c.OutletID
) as t1
left join Outlet_Profile as o on o.Outlet_ID = t1.OutletID
where LEFT( o.OutletDesc_1, CHARINDEX(' ',  o.OutletDesc_1) - 1) = 'IK'
order by t1.amount asc
;  

 

select  min( PaidAmount) as 'min',  max( PaidAmount) as 'max'
from OP_MonthlyCheckPayment
where date between '2024-01-01' and '2024-01-01';
;
  
select * from OutletGroup;

 select t1.*, o.OutletDesc_1 from (
select   c.OutletID , sum( p.PaidAmount) as 'amount'
from OP_MonthlyCheck as c
left join OP_MonthlyCheckPayment as p 
ON	c.CheckID = p.CheckID AND 
	c.OutletID = p.OutletID AND
	c.date = p.date
where c.date between '2024-01-01' and '2024-01-01' and c.TableNo != ''
group by  c.OutletID
) as t1
left join Outlet_Profile as o on o.Outlet_ID = t1.OutletID
  
 