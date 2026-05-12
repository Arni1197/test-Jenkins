// user-service/src/kafka/kafka.producer.ts
import {
    Injectable,
    Logger,
    OnApplicationShutdown,
    OnModuleInit,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Kafka, Producer } from 'kafkajs';
  
  @Injectable()
  export class KafkaProducer implements OnModuleInit, OnApplicationShutdown {
    private readonly logger = new Logger(KafkaProducer.name);
    private producer: Producer;
  
    constructor(private readonly configService: ConfigService) {
      const brokers = this.configService
        .get<string>('KAFKA_BROKERS', '192.168.0.16:9092')
        .split(',')
        .map((broker) => broker.trim());
  
      const username = this.configService.get<string>('KAFKA_USERNAME');
      const password = this.configService.get<string>('KAFKA_PASSWORD');
  
      const kafka = new Kafka({
        clientId: this.configService.get<string>(
          'KAFKA_CLIENT_ID',
          'user-service',
        ),
        brokers,
        ssl: false,
        sasl:
          username && password
            ? {
                mechanism: 'scram-sha-512',
                username,
                password,
              }
            : undefined,
      });
  
      this.producer = kafka.producer();
    }
  
    async onModuleInit() {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    }
  
    async emit(topic: string, message: unknown, key?: string) {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
          },
        ],
      });
    }
  
    async onApplicationShutdown() {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }