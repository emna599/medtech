package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.QrCodeDto;
import com.esigelec.ehpad_backend.service.QrCodeService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/admin/residents/{residentId}/qr-codes")
public class QrCodeController {

    private final QrCodeService qrCodeService;

    public QrCodeController(QrCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping
    public List<QrCodeDto> findByResidentId(@PathVariable("residentId") Long residentId) {
        return qrCodeService.findByResidentId(residentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QrCodeDto generate(@PathVariable("residentId") Long residentId,
                              @RequestParam(name = "activeQrCodeId", required = false) Long activeQrCodeId,
                              Authentication authentication) {
        return qrCodeService.generateForResident(residentId, activeQrCodeId, authentication.getName());
    }

    @PutMapping("/{qrCodeId}/deactivate")
    public QrCodeDto deactivate(@PathVariable("residentId") Long residentId,
                                @PathVariable("qrCodeId") Long qrCodeId, Authentication authentication) {
        return qrCodeService.deactivate(residentId, qrCodeId, authentication.getName());
    }
}
