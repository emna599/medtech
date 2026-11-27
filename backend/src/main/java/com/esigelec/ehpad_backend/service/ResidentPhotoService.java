package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.ResidentPhoto;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ForbiddenException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentPhotoRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;

/** Photos des résidents : seul l'administrateur les envoie, tout le personnel les voit. */
@Service
public class ResidentPhotoService {

    private static final long MAX_BYTES = 3L * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final ResidentPhotoRepository photoRepository;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public ResidentPhotoService(ResidentPhotoRepository photoRepository,
                                ResidentRepository residentRepository,
                                CurrentUserService currentUserService,
                                AuditService auditService) {
        this.photoRepository = photoRepository;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @Transactional
    public String save(Long residentId, MultipartFile file, String username) {
        User user = currentUserService.require(username);
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Seul l'administrateur peut modifier les photos des résidents.");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Aucune photo reçue");
        }
        if (file.getContentType() == null || !TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Format non accepté : utilisez une image JPEG, PNG ou WebP");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Photo trop lourde (3 Mo maximum)");
        }
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("La photo n'a pas pu être lue");
        }
        ResidentPhoto photo = photoRepository.findById(residentId).orElseGet(() -> new ResidentPhoto(residentId));
        photo.setContentType(file.getContentType());
        photo.setData(bytes);
        photo.setUpdatedAt(LocalDateTime.now());
        photoRepository.save(photo);

        // « ?v= » change à chaque envoi pour que les navigateurs rechargent la nouvelle photo.
        String url = "/api/personnel/residents/" + residentId + "/photo?v=" + System.currentTimeMillis();
        resident.setPhotoUrl(url);
        auditService.record(user, "PHOTO_RESIDENT", "Resident", residentId);
        return url;
    }

    @Transactional(readOnly = true)
    public ResidentPhoto get(Long residentId) {
        return photoRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pas de photo pour ce résident"));
    }
}
