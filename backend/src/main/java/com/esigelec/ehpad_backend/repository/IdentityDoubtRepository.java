package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.IdentityDoubt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface IdentityDoubtRepository extends JpaRepository<IdentityDoubt, Long> {

    boolean existsByResidentIdAndResolvedFalse(Long residentId);

    @Query("select d from IdentityDoubt d join fetch d.resident join fetch d.reportedBy "
            + "where d.resolved = false order by d.createdAt desc")
    List<IdentityDoubt> findOpenWithDetails();

    @Query("select d from IdentityDoubt d join fetch d.resident join fetch d.reportedBy where d.id = :id")
    java.util.Optional<IdentityDoubt> findWithDetailsById(@org.springframework.data.repository.query.Param("id") Long id);

    @Query("select d.resident.id from IdentityDoubt d where d.id = :id")
    java.util.Optional<Long> findResidentId(@org.springframework.data.repository.query.Param("id") Long id);

    @Query("select d.resident.id from IdentityDoubt d where d.resolved = false and d.resident.id in :ids")
    List<Long> findResidentIdsWithOpenDoubt(@org.springframework.data.repository.query.Param("ids") Collection<Long> ids);
}
