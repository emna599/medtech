package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select entity from Room entity where entity.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);

    Optional<Room> findByNumber(String number);
}
