package com.flavio.backend.dto;

import lombok.Data;

@Data
public class TaskRequestDTO {
    private String title;
    private String status;
    private String priority;
    private String tag;
}