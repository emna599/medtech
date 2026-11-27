package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.NoteDto;
import com.esigelec.ehpad_backend.dto.NoteRequest;
import com.esigelec.ehpad_backend.entity.NoteCategory;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.StaffNote;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.StaffNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Notes de traçabilité des soignants (dictées ou saisies). Chaque note est horodatée et signée. */
@Service
public class NoteService {

    private final StaffNoteRepository noteRepository;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final StaffService staffService;
    private final AuditService auditService;

    public NoteService(StaffNoteRepository noteRepository,
                       ResidentRepository residentRepository,
                       CurrentUserService currentUserService,
                       StaffService staffService,
                       AuditService auditService) {
        this.noteRepository = noteRepository;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.staffService = staffService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<NoteDto> list(Long residentId) {
        List<StaffNote> notes = residentId == null
                ? noteRepository.findTop50ByOrderByCreatedAtDesc()
                : noteRepository.findTop50ByResident_IdOrderByCreatedAtDesc(residentId);
        return notes.stream().map(this::toDto).toList();
    }

    @Transactional
    public NoteDto create(NoteRequest request, String username) {
        User user = currentUserService.require(username);
        StaffNote note = new StaffNote();
        note.setContent(request.content().trim());
        note.setCategory(request.category() == null ? NoteCategory.TRACABILITE : request.category());
        note.setCreatedAt(LocalDateTime.now());
        note.setUser(user);
        if (request.residentId() != null) {
            Resident resident = residentRepository.findActiveById(request.residentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
            note.setResident(resident);
        }
        StaffNote saved = noteRepository.save(note);
        auditService.record(user, "NOTE_TRACABILITE", "StaffNote", saved.getId());
        return toDto(saved);
    }

    private NoteDto toDto(StaffNote note) {
        Resident resident = note.getResident();
        NoteDto.ResidentRef ref = resident == null
                ? null
                : new NoteDto.ResidentRef(
                        resident.getId(),
                        resident.getFirstName() + " " + resident.getLastName(),
                        resident.getRoom() == null ? null : resident.getRoom().getNumber());
        return new NoteDto(
                note.getId(),
                note.getContent(),
                note.getCategory().name(),
                note.getCreatedAt(),
                note.getUser().getFullName(),
                staffService.jobOf(note.getUser()).name(),
                ref);
    }
}
