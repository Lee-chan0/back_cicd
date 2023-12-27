#!/bin/bash

while true; do
    for CONTAINER in $(docker-compose ps --format "{{.Name}} {{.State}}"); do
        CONTAINER_NAME=$(echo "$CONTAINER" | awk '{print $1}')
        CONTAINER_STATE=$(echo "$CONTAINER" | awk '{print $2}')

        if [ "$CONTAINER_STATE" == "running" ]; then
            SERVICE_NAME=${CONTAINER_NAME%%_*} 
            SERVICE_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME)

            if [ "$SERVICE_STATUS" == "unhealthy" ]; then
                echo "Service $SERVICE_NAME ($CONTAINER_NAME) is unhealthy. 재시작합니다."
                docker-compose restart $SERVICE_NAME
            elif [ "$SERVICE_STATUS" == "healthy" ]; then
                echo "Service $SERVICE_NAME ($CONTAINER_NAME) is healthy"
            else
                echo "Service $SERVICE_NAME ($CONTAINER_NAME) status: $SERVICE_STATUS"
            fi
        fi
    done

    sleep 30
done
