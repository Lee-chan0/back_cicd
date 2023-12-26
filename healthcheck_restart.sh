#!/bin/bash

SERVICE_NAME="blue"  


while true; do

    CONTAINER_ID=$(docker-compose ps -q $SERVICE_NAME)

    if [ ! -z "$CONTAINER_ID" ]; then
        SERVICE_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_ID)

        if [ "$SERVICE_STATUS" == "unhealthy" ]; then
            echo "Service $SERVICE_NAME is unhealthy. Restarting..."
            docker-compose restart $SERVICE_NAME
        elif [ "$SERVICE_STATUS" == "healthy" ]; then
            echo "Service $SERVICE_NAME is healthy"
        else
            echo "Service $SERVICE_NAME status: $SERVICE_STATUS"
        fi
    else
        echo "Service $SERVICE_NAME is not running."
    fi

    # 30초마다 반복
    sleep 30
done
