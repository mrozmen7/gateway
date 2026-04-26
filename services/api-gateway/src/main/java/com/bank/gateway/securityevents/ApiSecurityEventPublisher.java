package com.bank.gateway.securityevents;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class ApiSecurityEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ApiSecurityEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String topic;

    public ApiSecurityEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${bank.security-events.enabled}") boolean enabled,
            @Value("${bank.security-events.topic}") String topic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.topic = topic;
    }

    public void publish(ApiSecurityEvent event) {
        if (!enabled) {
            return;
        }

        try {
            kafkaTemplate.send(topic, event.userId(), objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException exception) {
            log.warn("Could not serialize API security event {}", event.eventId(), exception);
        } catch (Exception exception) {
            log.warn("Could not publish API security event {} to topic {}", event.eventId(), topic, exception);
        }
    }
}
