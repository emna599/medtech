package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** Photo d'un résident envoyée par l'administrateur (stockée dans la base). */
@Entity
@Table(name = "resident_photo")
public class ResidentPhoto {

    @Id
    @Column(name = "resident_id")
    private Long residentId;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected ResidentPhoto() {
    }

    public ResidentPhoto(Long residentId) {
        this.residentId = residentId;
    }

    public Long getResidentId() { return residentId; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
