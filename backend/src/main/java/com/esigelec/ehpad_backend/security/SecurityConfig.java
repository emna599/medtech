package com.esigelec.ehpad_backend.security;

import com.esigelec.ehpad_backend.repository.StaffProfileRepository;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtService jwtService,
                                                   UserRepository userRepository,
                                                   AuthSessionStore sessions,
                                                   StaffProfileRepository profiles,
                                                   CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                // Jetons Bearer uniquement, sans cookie d’authentification.
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/resident-photos/*").hasAnyRole("ADMIN", "PERSONNEL", "MEDECIN")
                        .requestMatchers(HttpMethod.POST, "/api/identification/bracelet").hasAnyRole("ADMIN", "PERSONNEL", "MEDECIN", "DINING_SERVICE")
                        .requestMatchers("/api/residents/*/qr-codes", "/api/residents/*/qr-codes/**").denyAll()
                        .requestMatchers("/api/kitchen/**").hasRole("KITCHEN")
                        .requestMatchers(HttpMethod.GET, "/api/personnel/access").hasAnyRole("PERSONNEL", "ADMIN", "DINING_SERVICE", "KITCHEN")
                        .requestMatchers(HttpMethod.GET, "/api/personnel/dining/tables", "/api/personnel/dining/menu").hasAnyRole("PERSONNEL", "DINING_SERVICE")
                        .requestMatchers(HttpMethod.POST, "/api/personnel/dining/readings").hasAnyRole("PERSONNEL", "DINING_SERVICE")
                        .requestMatchers(HttpMethod.PUT, "/api/personnel/dining/chevalets/*").hasAnyRole("PERSONNEL", "DINING_SERVICE")
                        .requestMatchers(HttpMethod.DELETE, "/api/personnel/dining/chevalets/*/*").hasAnyRole("PERSONNEL", "DINING_SERVICE")
                        .requestMatchers(HttpMethod.POST, "/api/personnel/team/rfid").hasAnyRole("PERSONNEL", "DINING_SERVICE", "KITCHEN")
                        .requestMatchers("/api/personnel/planning",
                                "/api/personnel/team", "/api/personnel/team/**",
                                "/api/personnel/notes", "/api/personnel/dining/**").hasRole("PERSONNEL")
                        .requestMatchers("/api/personnel/**").hasAnyRole("PERSONNEL", "ADMIN")
                        .requestMatchers("/api/suivi-resident/**").hasAnyRole("PERSONNEL", "MEDECIN")
                        .requestMatchers("/api/releve", "/api/releve/**").hasRole("PERSONNEL")
                        .requestMatchers("/api/residents", "/api/residents/**").hasRole("MEDECIN")
                        .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, userRepository, sessions, profiles),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
