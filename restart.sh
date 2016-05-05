#!/bin/bash
PROCPWD='/data/nba2/nba2_server/app/logTool/bin'
PID=$(ps -ef | grep "node cluster.js"| grep -v grep|awk '{print $2}')
if [[ $PID -gt 0 ]]; then
    echo "stop main cluster($PID) ..."
    kill -9 $PID
else
    echo "no cluster is living"
fi
sleep 1

(cd ./bin; nohup /usr/local/bin/node cluster.js  > output.log 2>&1 &)

sleep 1
PID=$(ps -ef | grep "node cluster.js"| grep -v grep|awk '{print $2}')
if [[ $PID -gt 0 ]]; then
    echo "success start cluster: $PID"
else
    echo "start cluster failed!"
fi
