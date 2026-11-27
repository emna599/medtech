package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.PochetteScanDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Lit l'étiquette d'une pochette de médicaments grâce au service OCR de l'équipe (Flask, /scan),
 * puis retrouve le résident correspondant dans la base. Facultatif : si le service n'est pas démarré,
 * on répond UNAVAILABLE et le soignant utilise un autre moyen d'identification.
 */
@Service
public class PochetteScanService {

    private final RestClient ocrClient;
    private final ResidentService residentService;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public PochetteScanService(@Value("${ocr.service.url}") String ocrUrl,
                               ResidentService residentService,
                               CurrentUserService currentUserService,
                               AuditService auditService) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(40)); // la première lecture charge les modèles OCR
        this.ocrClient = RestClient.builder().baseUrl(ocrUrl).requestFactory(factory).build();
        this.residentService = residentService;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    public PochetteScanDto scan(MultipartFile photo, String username) {
        if (photo == null || photo.isEmpty()) {
            throw new BadRequestException("Aucune photo reçue");
        }
        String type = photo.getContentType();
        if (type == null || !type.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new BadRequestException("Le fichier doit être une image");
        }
        User user = currentUserService.require(username);

        Map<String, Object> response;
        try {
            response = callOcr(photo);
        } catch (RestClientException | IOException e) {
            return new PochetteScanDto("UNAVAILABLE",
                    "Le service de lecture des pochettes ne répond pas. Utilisez le code du bracelet ou demandez à un collègue.",
                    null, null, null, null, null);
        }
        if (response == null || response.get("error") != null) {
            return new PochetteScanDto("UNAVAILABLE", "La lecture de l'étiquette a échoué. Réessayez avec une photo plus nette.",
                    null, null, null, null, null);
        }

        String status = text(response.get("status"));
        String nameRead = text(response.get("resident"));
        Map<?, ?> label = firstLabel(response.get("etiquettes"), nameRead);
        String prise = label == null ? null : text(label.get("prise"));
        String date = label == null ? null : text(label.get("date"));
        String medications = label == null ? null : text(label.get("medicaments"));

        if ("AMBIGU".equals(status) || "PLUSIEURS".equals(status)) {
            return new PochetteScanDto("AMBIGUOUS",
                    "Plusieurs noms ont été lus sur la photo. Photographiez une seule étiquette.",
                    null, nameRead, prise, date, medications);
        }
        if (!"RECONNU".equals(status) || nameRead == null) {
            return new PochetteScanDto("NOT_FOUND",
                    "Aucun résident reconnu sur cette étiquette. Réessayez ou utilisez le code du bracelet.",
                    null, null, prise, date, medications);
        }

        List<ResidentCardDto> matches = match(nameRead, residentService.list(null));
        if (matches.size() != 1) {
            return new PochetteScanDto(matches.isEmpty() ? "NOT_FOUND" : "AMBIGUOUS",
                    matches.isEmpty()
                            ? "Le nom lu (« " + nameRead + " ») ne correspond à aucun résident."
                            : "Plusieurs résidents correspondent au nom lu. Vérifiez à la main.",
                    null, nameRead, prise, date, medications);
        }
        ResidentCardDto resident = matches.get(0);
        auditService.record(user, "IDENTIFICATION_POCHETTE", "Resident", resident.id());
        return new PochetteScanDto("FOUND", "Étiquette lue. Comparez le visage à la photo avant de continuer.",
                resident, nameRead, prise, date, medications);
    }

    private Map<String, Object> callOcr(MultipartFile photo) throws IOException {
        byte[] bytes = photo.getBytes();
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("photo", new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return "pochette.jpg";
            }
        });
        return ocrClient.post()
                .uri("/scan")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {
                });
    }

    /** Le nom lu (« NOM PRÉNOM » ou « PRÉNOM NOM », sans accents) doit contenir à la fois le nom et le prénom. */
    static List<ResidentCardDto> match(String nameRead, List<ResidentCardDto> residents) {
        List<String> tokens = Arrays.asList(normalize(nameRead).split(" "));
        List<ResidentCardDto> out = new ArrayList<>();
        for (ResidentCardDto r : residents) {
            if (tokens.contains(normalize(r.lastName())) && tokens.contains(normalize(r.firstName()))) {
                out.add(r);
            }
        }
        return out;
    }

    private static Map<?, ?> firstLabel(Object etiquettes, String name) {
        if (!(etiquettes instanceof List<?> list)) {
            return null;
        }
        Map<?, ?> first = null;
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                if (first == null) {
                    first = map;
                }
                if (name != null && name.equals(text(map.get("resident")))) {
                    return map;
                }
            }
        }
        return first;
    }

    private static String text(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", " ")
                .trim();
    }
}
