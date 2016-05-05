var daily_statistic = require('../routes/dailyDayStatistic.js');

module.exports = function() {
    setInterval(daily, 15*60000); //15分钟检测一次
};

function daily() {
    var nowDate = new Date();
    //crontab每日5点半跑入库脚本
    if(nowDate.getHours() > 7){
        daily_statistic.check(); 
    }
}
