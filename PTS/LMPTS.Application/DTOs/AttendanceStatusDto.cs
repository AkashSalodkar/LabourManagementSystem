using System;
using System.Collections.Generic;
using System.Text;

namespace LMPTS.Application.DTOs
{
    public class AttendanceStatusDto
    {
        public string Status { get; set; } // P, HD, A
        public DateTime? MarkedAt { get; set; }
        public string Note { get; set; }
    }
}
