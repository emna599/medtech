package com.esigelec.ehpad_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EhpadBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EhpadBackendApplication.class, args);
	}

}
