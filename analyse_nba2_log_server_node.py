import sys;
import re; 
import json;
import string;
import pymongo;
from  datetime  import  *  
import  time 

opeClient = {}; 
opeLogType = {}; 
opeDBName = 'nba2_ope_db';
opeExpireTime = 45*86400;
opeLogTypeConfigHost = "127.0.0.1";
opeLogTypeConfigPort = 27017;

def checkTimestamp(time):
    try:
        if (len(time) == 13):
            return int(time)/1000;
        elif (len(time) == 10):
            return int(time);
        else:
            return 0;
    except:
        return -1;

def getTimestampTag():
    now = datetime.today();
    return now.strftime('%Y%m%d');

def getOpeLog(ope):
    if (opeLogType.has_key(ope)):
        return int(opeLogType.get(ope));
    else:
        if (len(ope) <= 30):
            opeLogType[ope] = int(opeLogType.get('OPE_START')+len(opeLogType));
            setOpeLog(ope);
            return int(opeLogType.get(ope));
        else:
            print '=========>>>0101', ope 
        return 0;

def setOpeLog(ope):
    conn = pymongo.MongoClient(opeLogTypeConfigHost, opeLogTypeConfigPort);
    conn.nba2.nba2_ope_type.insert_one({'_id': opeLogType.get(ope), 'value': ope})

def analyse(server, node, client, lines):
    nowTime = datetime.utcnow();
    count = 0;
    total = 0;
    for line in lines:
        total += 1;
        opeDict = {'date':nowTime};
        opeLog = line[string.find(line, str('OPE_')):].replace("\n", "").split('%');
        flag = True;
        for i, item in enumerate(opeLog):
            if (i==0):
                opeDict['f0'] = getOpeLog(item);
            elif (i==1):
                opeDict['f1'] = checkTimestamp(item);
            elif (i==2):
                opeDict['f2'] = item;
            else:
                #if (isinstance(item, int)):    #all item is str
                if (item.isalnum()):
                    if (item.isdigit() and int(item) < 100000):  
                        opeDict['f'+str(i)] = int(item);
                    else:
                        opeDict['f'+str(i)] = item;
                else:
                    try:
                        opeDict['f'+str(i)] = json.loads(item);
                    except:
                    #    print '[ERROR]', '==>', item, '<==', opeLog
                        flag = False;
        if(flag):
    #        print opeDict;
            try:
                client.insert_one(opeDict);
                count += 1;
            except:
                print '[ERROR2]', '==>', opeDict, '<=='
    print '[',nowTime,']Server:',server,'Node:',node,' all log datas is ',total,' lines, and ',count,' is success!'
    return count;

def init(server, node, lines):
    conn = pymongo.MongoClient(opeLogTypeConfigHost, opeLogTypeConfigPort);
    for item in conn.nba2.nba2_ope_type.find():
        value = item['value'];
        opeLogType[value] = item['_id'];

    opeDB = conn.nba2.nba2_ope_config.find_one({'_id': 1});
    conn = pymongo.MongoClient(str(opeDB['host']), int(opeDB['port']));

    opeClient = conn[opeDBName]['nba2_ope_log_'+str(server)];

    opeClient.create_index("date", expireAfterSeconds=opeExpireTime);

	#conn.nba2.nba2_game_log.create_index(["server","node","date"]);
    conn.nba2.nba2_game_log.insert_one({'server': server, 'node': node, 'date': getTimestampTag(), 'count': 0, 'process': 1});

    count = analyse(server, node, opeClient, lines);

    conn.nba2.nba2_game_log.update_one({'server': server, 'node': node, 'date': getTimestampTag()}, {'$set':{'count': count, 'process': 2}});

def main():
    if (len(sys.argv) != 4):
        print "Usage:python  analyse_nba2_log.py platform(simp, trad) Server(1,2...) Node(1,2...)"
        return ;

    server = string.atoi(sys.argv[2]);
    logLines = sys.stdin.readlines();
    init(string.atoi(sys.argv[2]), string.atoi(sys.argv[3]), logLines);


main();
