package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.service.ResidentPhotoService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ResidentPhotoController {

    private final ResidentPhotoService photos;

    public ResidentPhotoController(ResidentPhotoService photos) {
        this.photos = photos;
    }

    @GetMapping("/api/resident-photos/{residentId}")
    public ResponseEntity<byte[]> get(@PathVariable long residentId, Authentication auth) {
        boolean activeOnly = auth.getAuthorities().stream().anyMatch(a -> "ROLE_PERSONNEL".equals(a.getAuthority()));
        byte[] photo = photos.get(residentId, activeOnly);
        if (photo == null) return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.IMAGE_JPEG).body(photo);
    }

    @PutMapping(path = "/api/admin/residents/{residentId}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void put(@PathVariable long residentId, @RequestPart("photo") MultipartFile photo, Authentication auth) {
        photos.replace(residentId, photo, auth.getName());
    }

    @DeleteMapping("/api/admin/residents/{residentId}/photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long residentId, Authentication auth) {
        photos.remove(residentId, auth.getName());
    }
}
