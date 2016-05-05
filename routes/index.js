var login = require('./login');
var queryCommonDataAsWuid = require('./queryCommonDataAsWuid');
var queryBattleDataAsWuid = require('./queryBattleDataAsWuid');
var queryNiuDanAsWuid = require('./queryNiuDanAsWuid');
var queryEquipAsWuid = require('./queryEquipAsWuid');
var queryGetCardAsWuid = require('./queryGetCardAsWuid');
var queryGetCostAsWuid = require('./queryGetCostAsWuid');
var queryGiftPackageAsWuid = require('./queryGiftPackageAsWuid');
var queryLoginInfoAsWuid = require('./queryLoginInfoAsWuid');
var queryCardTrainAsWuid = require('./queryCardTrainAsWuid');
var backupQueryMidToWuid = require('./backupQueryMidToWuid');
var backupQueryWuidToBase = require('./backupQueryWuidToBase');
var backupQueryWuidToMid = require('./backupQueryWuidToMid');
var backupQueryWuidToRecharge = require('./backupQueryWuidToRecharge');
var backupQueryPersonByName = require('./backupQueryPersonByName');
var backupQueryPersonInfo = require('./backupQueryPersonInfo');
var backupQueryCardInfo = require('./backupQueryCardInfo');
var backupQueryCoachInfo = require('./backupQueryCoachInfo');
var backupQueryItemInfo = require('./backupQueryItemInfo');
var backupStatistics = require('./backupStatistics');
var backupItemsInfo = require('./backupItemsInfo');
var backupUsersInfo = require('./backupUsersInfo');
var backupQueryHeyueInfo = require('./backupQueryHeyueInfo');
var queryDayMoneyDetail = require('./queryDayMoneyDetail');
var queryDayCoinDetail = require('./queryDayCoinDetail');
var queryDayMatchDetail = require('./queryDayMatchDetail');
var queryDayLegendRemain = require('./queryDayLegendRemain');
var queryDayLegendEnter = require('./queryDayLegendEnter');
var queryDayPersonMoney = require('./queryDayPersonMoney');
var statisticRecharge = require('./statisticRecharge');
var statisticGiftPackage = require('./statisticGiftPackage');
var statisticNiuDan = require('./statisticNiuDan');
var statisticLogin = require('./statisticLogin');
var statisticMonthCard = require('./statisticMonthCard');
var statisticMoney = require('./statisticMoney');
var statisticOpenServer = require('./statisticOpenServer');
var querySeasonTianTiRank = require('./querySeasonTianTiRank');
var slaveQueryWuidToMid = require('./slaveQueryWuidToMid');
var queryMatchInfo = require('./queryMatchInfo');
var helperActionType = require('./helperActionType');
var helperCheckServerLogs = require('./helperCheckServerLogs');

module.exports = function(app) {
    app.all('/', index);
    app.all('/login', login.index);
    //app.all('/queryLogData',requireAuthentication, queryLogData.index);
    //app.all('/queryLogFiles',requireAuthentication, qeeryLogFiles.index);
    /**********************common user log query******************/
    app.all('/queryCommonDataAsWuid', queryCommonDataAsWuid.index); //常用查询
    app.all('/queryBattleDataAsWuid', queryBattleDataAsWuid.index); //战斗查询
    app.all('/queryNiuDanAsWuid', queryNiuDanAsWuid.index);         //选秀查询
    app.all('/queryEquipAsWuid', queryEquipAsWuid.index);           //装备查询
    app.all('/queryGetCardAsWuid', queryGetCardAsWuid.index);       //获得查询
    app.all('/queryGetCostAsWuid', queryGetCostAsWuid.index);       //卡牌查询
    app.all('/queryGiftPackageAsWuid', queryGiftPackageAsWuid.index);//礼包查询
    app.all('/queryLoginInfoAsWuid', queryLoginInfoAsWuid.index);   //登陆信息查询
    app.all('/queryCardTrainAsWuid', queryCardTrainAsWuid.index);   //球员养成
    /*********************backup query**************************/
    app.all('/backupQueryMidToWuid', backupQueryMidToWuid.index);
    app.all('/backupQueryWuidToMid', backupQueryWuidToMid.index);
    app.all('/backupQueryWuidToBase', backupQueryWuidToBase.index);
    app.all('/backupQueryWuidToRecharge', backupQueryWuidToRecharge.index);
    app.all('/backupQueryPersonByName', backupQueryPersonByName.index); //玩家个人信息
    app.all('/backupQueryPersonInfo', backupQueryPersonInfo.index); //玩家个人信息
    app.all('/backupQueryCardInfo', backupQueryCardInfo.index);     //玩家卡牌信息   
    app.all('/backupQueryCoachInfo', backupQueryCoachInfo.index);   //玩家教练信息
    app.all('/backupQueryItemInfo', backupQueryItemInfo.index);     //玩家装备信息
    app.all('/backupStatistics', backupStatistics.index);           //备库统计信息
    app.all('/backupItemsInfo', backupItemsInfo.index);             //备库统计物品信息
    app.all('/backupUsersInfo', backupUsersInfo.index);             //备库查询球队信息
    app.all('/backupQueryHeyueInfo', backupQueryHeyueInfo.index);             //备库查询合约信息
    /*********************day data query**************************/
    app.all('/queryDayMoneyDetail', queryDayMoneyDetail.index);     //每日钻石产出与消耗
    app.all('/queryDayCoinDetail', queryDayCoinDetail.index);       //每日金币产出与消耗
    app.all('/queryDayMatchDetail', queryDayMatchDetail.index);     //每日各比赛参与次数
    app.all('/queryDayLegendRemain', queryDayLegendRemain.index);   //每日冠军之路各关卡留存情况
    app.all('/queryDayLegendEnter', queryDayLegendEnter.index);     //每日冠军之路各关卡进入次数
    app.all('/queryDayPersonMoney', queryDayPersonMoney.index);     //钻石每日个人产出消耗
    /*********************statistic**************************/
    app.all('/statisticRecharge', statisticRecharge.index);         //统计充值信息
    app.all('/statisticGiftPackage', statisticGiftPackage.index);   //统计活动商城礼包购买
    app.all('/statisticNiuDan', statisticNiuDan.index);             //统计选秀次数
    app.all('/statisticLogin', statisticLogin.index);               //统计登陆信息
    app.all('/statisticMonthCard', statisticMonthCard.index);       //统计月卡购买
    app.all('/statisticMoney', statisticMoney.index);               //统计钻石详情
    app.all('/statisticOpenServer', statisticOpenServer.index);     //统计开服活动
    /*********************match query**************************/
    app.all('/querySeasonTianTiRank', querySeasonTianTiRank.index); //天梯历史排名查询
    app.all('/queryMatchInfo', queryMatchInfo.index);               //比赛数据查询
    /*********************slave query**************************/
    app.all('/slaveQueryWuidToMid', slaveQueryWuidToMid.index);     //从库Wuid->Mid查询
    /*********************helper**************************/
    app.all('/helperActionType', helperActionType.index);           //玩家操作表
    app.all('/helperCheckServerLogs', helperCheckServerLogs.index); //日志入库查询
};

function index (req, res) {
    var _stash = req.params;
    _stash.title = 'Log Tool';
    //req.session.hasLogin = false;
    res.render('index', {stash: _stash});
}

function requireAuthentication(req, res, next) {
    console.log('=====>>>00102:\t', req.session.hasLogin, !req.session.hasLogin);
    if (!req.session.hasLogin) {
        var _stash = req.body;
        _stash.error = 'Please login';
        res.render('index', {stash: _stash});
    } else {
        next();
    }
}
