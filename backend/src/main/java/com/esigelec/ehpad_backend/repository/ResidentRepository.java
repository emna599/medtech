package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ResidentRepository extends JpaRepository<Resident, Long> {

    /** Charge les résidents avec leur chambre en une seule requête. */
    @Query("select r from Resident r left join fetch r.room")
    List<Resident> findAllWithRoom();

    long countByRoomIdAndActiveTrue(Long roomId);

    /** Lignes [id de chambre, nombre de résidents actifs]. */
    @Query("select r.room.id, count(r) from Resident r where r.active = true and r.room is not null group by r.room.id")
    List<Object[]> countActiveByRoom();
}
