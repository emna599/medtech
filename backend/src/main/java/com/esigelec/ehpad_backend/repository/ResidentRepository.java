package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResidentRepository extends JpaRepository<Resident, Long> {

    @Query("select r from Resident r left join fetch r.room where r.active = true order by r.lastName, r.firstName")
    List<Resident> findAllActive();

    @Query("select r from Resident r left join fetch r.room where r.id = :id and r.active = true")
    Optional<Resident> findActiveById(@Param("id") Long id);

    @Query("select r from Resident r left join fetch r.room where r.identityCode = :code and r.active = true")
    Optional<Resident> findActiveByIdentityCode(@Param("code") String code);

    /** Résident associé à une puce NFC active (table resident_nfc_tag). */
    @Query(value = "select resident_id from resident_nfc_tag where upper(token) = upper(:token) and active = true", nativeQuery = true)
    Optional<Long> findResidentIdByActiveNfcToken(@Param("token") String token);

    /**
     * Résident associé à un jeton de QR code actif (table qr_code, générée par l'espace médecin).
     * Requête native pour ne pas dupliquer l'entité que l'équipe médecin peut ajouter de son côté.
     */
    @Query(value = "select resident_id from qr_code where token = :token and active = true", nativeQuery = true)
    Optional<Long> findResidentIdByActiveQrToken(@Param("token") String token);

    /** Résident associé à un chevalet (numéro saisi ou scanné). */
    @Query(value = "select resident_id from chevalet where upper(code) = upper(:code) and resident_id is not null", nativeQuery = true)
    Optional<Long> findResidentIdByChevaletCode(@Param("code") String code);

    /** Résidents qui portent un bracelet (puce NFC ou QR code actif) : les autres s'identifient par le nom et la photo. */
    @Query(value = "select resident_id from resident_nfc_tag where active = true "
            + "union select resident_id from qr_code where active = true", nativeQuery = true)
    List<Long> findResidentIdsWithBracelet();

    /** Associe (ou réassocie) une carte NFC à un résident : un jeton ne désigne qu'un résident. */
    @Modifying
    @Query(value = "insert into resident_nfc_tag (token, active, resident_id) values (:token, true, :residentId) "
            + "on conflict (token) do update set resident_id = :residentId, active = true", nativeQuery = true)
    void linkNfcTag(@Param("token") String token, @Param("residentId") Long residentId);

    /** Anciennes cartes écrites avec une autre casse : on retire les doublons avant d'associer. */
    @Modifying
    @Query(value = "delete from resident_nfc_tag where upper(token) = upper(:token)", nativeQuery = true)
    void unlinkNfcTag(@Param("token") String token);
}
