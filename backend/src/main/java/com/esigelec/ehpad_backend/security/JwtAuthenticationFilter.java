package com.esigelec.ehpad_backend.security;

import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lit l'en-tête "Authorization: Bearer <jeton>", vérifie le jeton, puis recharge l'utilisateur
 * depuis la base : le rôle utilisé est toujours celui de la base (pas celui écrit dans le jeton)
 * et un compte désactivé est refusé immédiatement.
 *
 * Volontairement PAS annoté @Component : il est ajouté à la chaîne dans SecurityConfig.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthSessionStore sessions;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository, AuthSessionStore sessions) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.sessions = sessions;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(BEARER_PREFIX.length()).trim();

            jwtService.extractSession(token)
                    .flatMap(session -> userRepository.findByUsername(session.username())
                            .filter(User::isEnabled)
                            .filter(user -> sessions.isActive(session.id(), user.getId())))
                    .ifPresent(user -> {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                user.getUsername(),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        }

        filterChain.doFilter(request, response);
    }
}
