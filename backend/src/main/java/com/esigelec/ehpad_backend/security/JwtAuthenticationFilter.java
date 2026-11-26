package com.esigelec.ehpad_backend.security;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.repository.StaffProfileRepository;
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

    public static final String DINING_AUTHORITY = "ROLE_DINING_SERVICE";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthSessionStore sessions;
    private final StaffProfileRepository profiles;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository, AuthSessionStore sessions,
                                   StaffProfileRepository profiles) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.sessions = sessions;
        this.profiles = profiles;
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
                                List.of(authorityFor(user)));
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        }

        filterChain.doFilter(request, response);
    }
    private SimpleGrantedAuthority authorityFor(User user) {
        if (user.getRole() == Role.PERSONNEL
                && profiles.findById(user.getId()).filter(profile -> profile.getJob() == Job.SERVICE).isPresent()) {
            return new SimpleGrantedAuthority(DINING_AUTHORITY);
        }
        return new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
    }
}
