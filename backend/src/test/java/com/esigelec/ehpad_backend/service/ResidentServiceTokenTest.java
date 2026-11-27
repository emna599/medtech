package com.esigelec.ehpad_backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResidentServiceTokenTest {

    @Test
    void keepsAPlainToken() {
        assertThat(ResidentService.extractToken("  QR-DEMO-001  ")).isEqualTo("QR-DEMO-001");
    }

    @Test
    void readsTheTokenFromAnAddress() {
        assertThat(ResidentService.extractToken("https://medtech.local/qr/abc123")).isEqualTo("abc123");
        assertThat(ResidentService.extractToken("https://medtech.local/qr/abc123/?x=1#top")).isEqualTo("abc123");
    }

    @Test
    void readsTheTokenFromAQueryParameter() {
        assertThat(ResidentService.extractToken("https://medtech.local/r?lang=fr&token=abc123&v=2")).isEqualTo("abc123");
    }

    @Test
    void toleratesEmptyInput() {
        assertThat(ResidentService.extractToken(null)).isEmpty();
        assertThat(ResidentService.extractToken("   ")).isEmpty();
    }
}
