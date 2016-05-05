exports.ItemValue = {
    Team_Exp:       20001//经理经验
    ,Game_Coin:     20002//游戏币
    ,Money_Coin:    20003//钻石
    ,Energy:        20004//体力
    ,Xunlian_Point: 20005//训练点
    ,JiNeng_Point:  20006 //技能点

    ,Qiupiao:       20009//球票
    ,TZS_Refresh:   20010//挑战赛刷新券

    ,Laba:          20011
    ,Legend_SaoDan: 20012 //PVE传奇扫荡券
    ,Mynba_Move:    20016 //我的NBA行动力
};

exports.ItemValue.ItemValue_GetValue = function(itemList, ItemId){
    if(itemList && ItemId){
        for(var i=itemList.length-1; i>=0; i--){
            if(ItemId==itemList[i].i){
                return itemList[i].a;
            }
        }
        return 0;
    }else{
        return 0;
    }
}

exports.ItemValue.ItemValue_GetValues = function(itemList, ItemIds){
    if(itemList && ItemIds){
        var len=ItemIds.length;
        if(len<1) return null;

        var valueList=new Array(len);
        for(var i=0; i<len; i++){
            valueList[i]=0;
            for(var j=itemList.length-1; j>=0; j--){
                if(ItemIds[i]==itemList[j].i){
                    valueList[i]+=itemList[j].a;
                    break;
                }
            }
        }
        return valueList;
    }else{
        return null;
    }
}

