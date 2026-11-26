package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.QrCodeDto;
import com.esigelec.ehpad_backend.entity.QrCode;

public final class QrCodeMapper {

    private QrCodeMapper() {
    }

    public static QrCodeDto toDto(QrCode qrCode) {
        return new QrCodeDto(
                qrCode.getId(),
                qrCode.isActive() ? qrCode.getToken() : null,
                qrCode.isActive(),
                qrCode.getResident().getId(),
                qrCode.getUser() == null ? null : qrCode.getUser().getId(),
                qrCode.getCreatedAt(),
                qrCode.getDeactivatedAt());
    }
}
