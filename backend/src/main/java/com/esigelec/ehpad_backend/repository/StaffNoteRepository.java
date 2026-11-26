package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.StaffNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StaffNoteRepository extends JpaRepository<StaffNote, Long> {

    List<StaffNote> findTop50ByOrderByCreatedAtDesc();

    List<StaffNote> findTop50ByResident_IdOrderByCreatedAtDesc(Long residentId);
}
