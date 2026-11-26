package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

@Service
public class ResidentPhotoService {

    private static final long MAX_BYTES = 1_000_000;
    private static final int MAX_DIMENSION = 4_096;
    private static final long MAX_PIXELS = 12_000_000;
    private static final int PHOTO_SIZE = 640;

    private final JdbcTemplate jdbc;
    private final ResidentRepository residents;
    private final CurrentUserService currentUser;
    private final AuditService audit;

    public ResidentPhotoService(JdbcTemplate jdbc, ResidentRepository residents, CurrentUserService currentUser,
                                AuditService audit) {
        this.jdbc = jdbc;
        this.residents = residents;
        this.currentUser = currentUser;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public byte[] get(long residentId, boolean activeOnly) {
        return jdbc.query("""
                select p.jpeg from resident_photo p join resident r on r.id = p.resident_id
                where r.id = ? and (not ? or r.active)
                """, rs -> rs.next() ? rs.getBytes(1) : null, residentId, activeOnly);
    }

    @Transactional
    public void replace(long residentId, MultipartFile upload, String username) {
        User user = currentUser.require(username);
        byte[] jpeg = normalize(upload);
        requireResident(residentId);
        jdbc.update("""
                insert into resident_photo (resident_id, jpeg) values (?, ?)
                on conflict (resident_id) do update set jpeg = excluded.jpeg, updated_at = localtimestamp
                """, residentId, jpeg);
        audit.record(user, "RESIDENT_PHOTO_ENREGISTREE", "Resident", residentId);
    }

    @Transactional
    public void remove(long residentId, String username) {
        User user = currentUser.require(username);
        requireResident(residentId);
        if (jdbc.update("delete from resident_photo where resident_id = ?", residentId) != 0) {
            audit.record(user, "RESIDENT_PHOTO_SUPPRIMEE", "Resident", residentId);
        }
    }

    private Resident requireResident(long residentId) {
        return residents.findByIdForUpdate(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable."));
    }

    private static byte[] normalize(MultipartFile upload) {
        if (upload.isEmpty() || upload.getSize() > MAX_BYTES) {
            throw new BadRequestException("Choisissez une image JPEG ou PNG de 1 Mo maximum.");
        }
        try (var bytes = upload.getInputStream(); var input = new MemoryCacheImageInputStream(bytes)) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new BadRequestException("Format d’image non reconnu.");
            ImageReader reader = readers.next();
            try {
                if (!"JPEG".equalsIgnoreCase(reader.getFormatName()) && !"PNG".equalsIgnoreCase(reader.getFormatName())) {
                    throw new BadRequestException("Formats autorisés : JPEG ou PNG.");
                }
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION
                        || (long) width * height > MAX_PIXELS) {
                    throw new BadRequestException("Les dimensions de l’image dépassent la limite.");
                }
                BufferedImage source = reader.read(0);
                double scale = Math.min(1, (double) PHOTO_SIZE / Math.max(width, height));
                int targetWidth = Math.max(1, (int) Math.round(width * scale));
                int targetHeight = Math.max(1, (int) Math.round(height * scale));
                BufferedImage target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D canvas = target.createGraphics();
                try {
                    canvas.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    canvas.drawImage(source, 0, 0, targetWidth, targetHeight, Color.WHITE, null);
                } finally {
                    canvas.dispose();
                }
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                if (!ImageIO.write(target, "JPEG", output)) throw new IllegalStateException("Encodeur JPEG indisponible.");
                return output.toByteArray();
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException error) {
            throw new BadRequestException("L’image est illisible.");
        }
    }
}
