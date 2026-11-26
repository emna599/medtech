package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.QrCodeResidentInfoDto;
import com.esigelec.ehpad_backend.service.QrCodeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/qr-codes")
public class QrCodeLookupController {

    private final QrCodeService qrCodeService;

    public QrCodeLookupController(QrCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping("/{token}")
    public QrCodeResidentInfoDto findResidentByToken(@PathVariable String token) {
        return qrCodeService.findResidentInfoByToken(token);
    }
}
